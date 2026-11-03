// Command kit is kit's tooling: today, building, serving and deploying the
// documentation site (ui.chrisgarlick.com). The registry commands (init, add,
// verify, diff) come later.
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"os/signal"
	"path"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/Chrisgarlick/kit/internal/site"
)

const usage = `kit: a small, fast, accessible component library

Usage:
  kit site build [-root .] [-out dist] [-base https://ui.chrisgarlick.com]
  kit site serve [-root .] [-addr localhost:8150]
  kit site deploy [-host chrisgarlick-server] [-dir /var/www/ui] [-keep 5] [-rollback]
`

func main() {
	if len(os.Args) < 3 || os.Args[1] != "site" {
		fmt.Fprint(os.Stderr, usage)
		os.Exit(2)
	}
	var err error
	switch os.Args[2] {
	case "build":
		err = build(os.Args[3:])
	case "serve":
		err = serve(os.Args[3:])
	case "deploy":
		err = deploy(os.Args[3:])
	default:
		fmt.Fprint(os.Stderr, usage)
		os.Exit(2)
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, "kit:", err)
		os.Exit(1)
	}
}

func build(args []string) error {
	fl := flag.NewFlagSet("site build", flag.ExitOnError)
	root := fl.String("root", ".", "the kit repository")
	out := fl.String("out", "dist", "where to write the site")
	base := fl.String("base", "https://ui.chrisgarlick.com", "public origin, for the sitemap and canonical links")
	_ = fl.Parse(args)

	s, err := site.Load(*root)
	if err != nil {
		return err
	}
	res, err := s.Build(*out, site.Options{BaseURL: *base})
	if err != nil {
		return err
	}
	fmt.Printf("Built %d pages from %d components into %s\n", len(res.Pages), len(s.Components), *out)
	names := make([]string, 0, len(res.Assets))
	for n := range res.Assets {
		names = append(names, n)
	}
	sort.Strings(names)
	for _, n := range names {
		u := res.Assets[n]
		fmt.Printf("  %-16s %7s  (%s gzipped)\n", n, kb(res.Bytes[u]), kb(gzSize(filepath.Join(*out, u))))
	}
	return nil
}

func kb(n int) string { return fmt.Sprintf("%.1f KB", float64(n)/1024) }

func gzSize(path string) int {
	if fi, err := os.Stat(path + ".gz"); err == nil {
		return int(fi.Size())
	}
	if fi, err := os.Stat(path); err == nil {
		return int(fi.Size())
	}
	return 0
}

// serve builds into a temporary folder, serves it, and rebuilds and reloads
// the browser whenever a component, token, template or asset changes.
func serve(args []string) error {
	fl := flag.NewFlagSet("site serve", flag.ExitOnError)
	root := fl.String("root", ".", "the kit repository")
	addr := fl.String("addr", "localhost:8150", "address to listen on")
	_ = fl.Parse(args)

	out, err := os.MkdirTemp("", "kit-serve-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(out)

	var mu sync.Mutex
	clients := map[chan struct{}]bool{}
	rebuild := func() {
		start := time.Now()
		s, err := site.Load(*root)
		if err == nil {
			_, err = s.Build(out, site.Options{Dev: true, BaseURL: "http://" + *addr})
		}
		if err != nil {
			fmt.Fprintf(os.Stderr, "build failed:\n  %s\n", strings.ReplaceAll(err.Error(), "\n", "\n  "))
			return
		}
		fmt.Printf("rebuilt in %s\n", time.Since(start).Round(time.Millisecond))
		mu.Lock()
		for c := range clients {
			select {
			case c <- struct{}{}:
			default:
			}
		}
		mu.Unlock()
	}
	rebuild()

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	go watch(ctx, *root, rebuild)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /_kit/events", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-store")
		c := make(chan struct{}, 1)
		mu.Lock()
		clients[c] = true
		mu.Unlock()
		defer func() { mu.Lock(); delete(clients, c); mu.Unlock() }()
		fl, _ := w.(http.Flusher)
		fmt.Fprint(w, ": connected\n\n")
		if fl != nil {
			fl.Flush()
		}
		for {
			select {
			case <-r.Context().Done():
				return
			case <-c:
				fmt.Fprint(w, "event: rebuilt\ndata: 1\n\n")
				if fl != nil {
					fl.Flush()
				}
			}
		}
	})
	dist, err := os.OpenRoot(out)
	if err != nil {
		return err
	}
	defer dist.Close()
	files := http.FileServerFS(dist.FS())
	mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// The same security headers the live site sends, so a CSP slip shows up here first.
		w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
		w.Header().Set("Cache-Control", "no-store")
		name := strings.TrimPrefix(path.Clean("/"+r.URL.Path), "/")
		if name == "" {
			name = "."
		}
		if _, err := dist.Stat(name); errors.Is(err, fs.ErrNotExist) {
			page, err := dist.ReadFile("404.html")
			if err != nil {
				http.NotFound(w, r)
				return
			}
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.WriteHeader(http.StatusNotFound)
			_, _ = w.Write(page)
			return
		}
		files.ServeHTTP(w, r)
	}))
	srv := &http.Server{Addr: *addr, Handler: mux, ReadHeaderTimeout: 5 * time.Second}
	go func() { <-ctx.Done(); _ = srv.Shutdown(context.Background()) }()
	fmt.Printf("kit site on http://%s (Ctrl-C to stop)\n", *addr)
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}

// watch polls the source folders and calls rebuild after a change settles.
func watch(ctx context.Context, root string, rebuild func()) {
	dirs := []string{"components", "tokens", "site"}
	stamp := func() string {
		var b strings.Builder
		for _, d := range dirs {
			_ = filepath.WalkDir(filepath.Join(root, d), func(p string, e fs.DirEntry, err error) error {
				if err != nil || e.IsDir() {
					return nil
				}
				if fi, err := e.Info(); err == nil {
					fmt.Fprintf(&b, "%s:%d:%d;", p, fi.Size(), fi.ModTime().UnixNano())
				}
				return nil
			})
		}
		return b.String()
	}
	last := stamp()
	t := time.NewTicker(400 * time.Millisecond)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			if now := stamp(); now != last {
				last = now
				rebuild()
			}
		}
	}
}
