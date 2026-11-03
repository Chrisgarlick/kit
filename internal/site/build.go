package site

import (
	"bytes"
	"compress/gzip"
	"encoding/json"
	"errors"
	"fmt"
	"html/template"
	"io/fs"
	"maps"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"time"

	"github.com/evanw/esbuild/pkg/api"
)

// Options change how the site is built.
type Options struct {
	// BaseURL is the public origin, for the sitemap and canonical links.
	BaseURL string
	// Dev adds the live-reload script and skips the .gz files.
	Dev bool
}

// Result describes a finished build.
type Result struct {
	Pages  []string          // URL paths, sorted
	Assets map[string]string // entry name (kit.css, site.js…) -> URL path
	Bytes  map[string]int    // asset URL path -> size on disk
}

// page is what every template receives.
type page struct {
	Title       string
	Description string
	Path        string
	Site        *Site
	Group       *Group
	Component   *Component
	Theme       *Theme
	ThemePage   *ThemePage
	Dev         bool
	BaseURL     string
	assets      map[string]string
}

// Asset returns the hashed URL of a bundle, by entry name.
func (p page) Asset(name string) (string, error) {
	u, ok := p.assets[name]
	if !ok {
		return "", fmt.Errorf("no asset %q", name)
	}
	return u, nil
}

// Build writes the whole site into out, emptying it first.
func (s *Site) Build(out string, opt Options) (*Result, error) {
	if opt.BaseURL == "" {
		opt.BaseURL = "https://ui.chrisgarlick.com"
	}
	opt.BaseURL = strings.TrimRight(opt.BaseURL, "/")
	out, err := filepath.Abs(out)
	if err != nil {
		return nil, err
	}
	if err := emptyDir(out); err != nil {
		return nil, err
	}
	res := &Result{Assets: map[string]string{}, Bytes: map[string]int{}}
	if err := s.bundle(out, opt, res); err != nil {
		return nil, err
	}

	tmpl, err := s.templates()
	if err != nil {
		return nil, err
	}
	base := page{Site: s, Dev: opt.Dev, BaseURL: opt.BaseURL, assets: res.Assets}
	render := func(name, urlPath string, p page) error {
		p.Path = urlPath
		t := tmpl[name]
		var buf bytes.Buffer
		if err := t.ExecuteTemplate(&buf, "layout", p); err != nil {
			return fmt.Errorf("%s (%s): %w", name, urlPath, err)
		}
		file := filepath.Join(out, filepath.FromSlash(strings.TrimPrefix(urlPath, "/")), "index.html")
		if urlPath == "/404.html" {
			file = filepath.Join(out, "404.html")
		}
		if err := os.MkdirAll(filepath.Dir(file), 0o755); err != nil {
			return err
		}
		res.Pages = append(res.Pages, urlPath)
		return os.WriteFile(file, buf.Bytes(), 0o644)
	}

	home := base
	home.Title, home.Description = "kit", "A small, fast, accessible component library for any backend."
	if err := render("home", "/", home); err != nil {
		return nil, err
	}
	f := base
	f.Title, f.Description = "Foundations", "The colours, type, spacing, depth and motion every kit component is made from."
	if err := render("foundations", "/foundations/", f); err != nil {
		return nil, err
	}
	for _, g := range s.Groups {
		p := base
		p.Group, p.Title, p.Description = g, g.Title, g.Summary
		if err := render("group", g.URL(), p); err != nil {
			return nil, err
		}
		for _, c := range g.Components {
			p := base
			p.Group, p.Component, p.Title, p.Description = g, c, c.Title, c.Summary
			if err := render("component", c.URL(), p); err != nil {
				return nil, err
			}
		}
	}
	for _, t := range s.Themes {
		p := base
		p.Theme, p.Title, p.Description = t, t.Title+" theme", t.Summary
		if err := render("theme", t.URL(), p); err != nil {
			return nil, err
		}
		for _, pg := range t.Pages {
			pt, err := s.themePage(t, pg)
			if err != nil {
				return nil, err
			}
			q := base
			q.Theme, q.ThemePage, q.Title, q.Description, q.Path = t, pg, pg.Title, pg.Summary, pg.URL()
			var buf bytes.Buffer
			if err := pt.ExecuteTemplate(&buf, "bare", q); err != nil {
				return nil, fmt.Errorf("%s: %w", pg.URL(), err)
			}
			file := filepath.Join(out, filepath.FromSlash(strings.TrimPrefix(pg.URL(), "/")), "index.html")
			if err := os.MkdirAll(filepath.Dir(file), 0o755); err != nil {
				return nil, err
			}
			if err := os.WriteFile(file, buf.Bytes(), 0o644); err != nil {
				return nil, err
			}
			res.Pages = append(res.Pages, pg.URL())
		}
	}
	nf := base
	nf.Title, nf.Description = "Not found", "This page doesn't exist."
	if err := render("notfound", "/404.html", nf); err != nil {
		return nil, err
	}

	if err := writeSitemap(out, opt.BaseURL, res.Pages); err != nil {
		return nil, err
	}
	if !opt.Dev {
		if err := gzipAll(out); err != nil {
			return nil, err
		}
	}
	slices.Sort(res.Pages)
	return res, nil
}

// bundle builds the CSS and JS with esbuild: kit.css (fonts, tokens and every
// component's CSS), foundations.css (classes for the token swatches),
// site.css and site.js. Names carry a content hash, so they can be cached
// for a year.
func (s *Site) bundle(out string, opt Options, res *Result) error {
	gen, err := os.MkdirTemp("", "kit-site-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(gen)

	var kit strings.Builder
	kit.WriteString("/* kit: fonts, tokens and every component */\n")
	for _, f := range []string{"tokens/fonts.css", "tokens/tokens.css"} {
		fmt.Fprintf(&kit, "@import %q;\n", filepath.ToSlash(filepath.Join(s.Root, f)))
	}
	for _, c := range s.Components {
		for _, f := range c.CSS {
			fmt.Fprintf(&kit, "@import %q;\n", filepath.ToSlash(filepath.Join(s.Root, f)))
		}
	}
	if err := os.WriteFile(filepath.Join(gen, "kit.css"), []byte(kit.String()), 0o600); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(gen, "foundations.css"), []byte(s.foundationsCSS()), 0o600); err != nil {
		return err
	}
	// kit.js: every tier 2 component (each imports the core pieces it uses).
	var kitJS strings.Builder
	kitJS.WriteString("// kit: every tier 2 component\n")
	for _, c := range s.Components {
		for _, f := range c.JS {
			fmt.Fprintf(&kitJS, "import %q;\n", filepath.ToSlash(filepath.Join(s.Root, f)))
		}
	}
	if err := os.WriteFile(filepath.Join(gen, "kit.js"), []byte(kitJS.String()), 0o600); err != nil {
		return err
	}
	// core.js: the whole core on its own, built only to measure it.
	coreIndex := filepath.Join(s.Root, "core", "index.js")
	_, err = os.Stat(coreIndex)
	hasCore := err == nil
	if hasCore {
		core := fmt.Sprintf("export * from %q;\n", filepath.ToSlash(coreIndex))
		if err := os.WriteFile(filepath.Join(gen, "core.js"), []byte(core), 0o600); err != nil {
			return err
		}
	}

	entries := []api.EntryPoint{
		{InputPath: filepath.Join(gen, "kit.css"), OutputPath: "kit"},
		{InputPath: filepath.Join(gen, "foundations.css"), OutputPath: "foundations"},
		{InputPath: filepath.Join(gen, "kit.js"), OutputPath: "kit"},
		{InputPath: filepath.Join(s.Root, "site", "assets", "site.css"), OutputPath: "site"},
		{InputPath: filepath.Join(s.Root, "site", "assets", "site.js"), OutputPath: "site"},
	}
	if hasCore {
		entries = append(entries, api.EntryPoint{InputPath: filepath.Join(gen, "core.js"), OutputPath: "core"})
	}
	// Each theme as its own stylesheet, named theme-<id>.css.
	for _, t := range s.Themes {
		name := "theme-" + t.ID
		src := fmt.Sprintf("@import %q;\n", filepath.ToSlash(filepath.Join(s.Root, "site", "themes", t.ID, "theme.css")))
		if err := os.WriteFile(filepath.Join(gen, name+".css"), []byte(src), 0o600); err != nil {
			return err
		}
		entries = append(entries, api.EntryPoint{InputPath: filepath.Join(gen, name+".css"), OutputPath: name})
	}
	if opt.Dev {
		entries = append(entries, api.EntryPoint{InputPath: filepath.Join(s.Root, "site", "assets", "reload.js"), OutputPath: "reload"})
	}
	r := api.Build(api.BuildOptions{
		EntryPointsAdvanced: entries,
		AbsWorkingDir:       s.Root,
		Bundle:              true,
		Write:               false,
		Metafile:            true,
		Outdir:              out,
		EntryNames:          "assets/[name]-[hash]",
		AssetNames:          "assets/[name]-[hash]",
		Loader:              map[string]api.Loader{".woff2": api.LoaderFile, ".svg": api.LoaderFile},
		MinifyWhitespace:    !opt.Dev,
		MinifyIdentifiers:   !opt.Dev,
		MinifySyntax:        !opt.Dev,
		Format:              api.FormatESModule,
		Target:              api.ES2022,
		Platform:            api.PlatformBrowser,
		LegalComments:       api.LegalCommentsNone,
		LogLevel:            api.LogLevelSilent,
	})
	if len(r.Errors) > 0 {
		return buildErr(r.Errors)
	}
	// prefs.js runs before first paint as a classic script, so it is its own
	// IIFE build.
	pr := api.Build(api.BuildOptions{
		EntryPointsAdvanced: []api.EntryPoint{{InputPath: filepath.Join(s.Root, "site", "assets", "prefs.js"), OutputPath: "prefs"}},
		AbsWorkingDir:       s.Root,
		Bundle:              true,
		Write:               false,
		Metafile:            true,
		Outdir:              out,
		EntryNames:          "assets/[name]-[hash]",
		MinifyWhitespace:    !opt.Dev,
		MinifyIdentifiers:   !opt.Dev,
		MinifySyntax:        !opt.Dev,
		Format:              api.FormatIIFE,
		Target:              api.ES2022,
		LogLevel:            api.LogLevelSilent,
	})
	r.Errors = append(r.Errors, pr.Errors...)
	r.OutputFiles = append(r.OutputFiles, pr.OutputFiles...)
	if len(r.Errors) > 0 {
		return buildErr(r.Errors)
	}
	for _, f := range r.OutputFiles {
		if err := os.MkdirAll(filepath.Dir(f.Path), 0o755); err != nil {
			return err
		}
		if err := os.WriteFile(f.Path, f.Contents, 0o644); err != nil {
			return err
		}
		if u, err := filepath.Rel(out, f.Path); err == nil {
			res.Bytes["/"+filepath.ToSlash(u)] = len(f.Contents)
		}
	}
	type metafile struct {
		Outputs map[string]struct {
			EntryPoint string `json:"entryPoint"`
		} `json:"outputs"`
	}
	var meta, prefsMeta metafile
	if err := json.Unmarshal([]byte(r.Metafile), &meta); err != nil {
		return err
	}
	if err := json.Unmarshal([]byte(pr.Metafile), &prefsMeta); err != nil {
		return err
	}
	maps.Copy(meta.Outputs, prefsMeta.Outputs)
	for outPath, o := range meta.Outputs {
		if o.EntryPoint == "" {
			continue
		}
		name := filepath.Base(o.EntryPoint) // kit.css, site.js, …
		if !filepath.IsAbs(outPath) {       // metafile paths are relative to AbsWorkingDir
			outPath = filepath.Join(s.Root, outPath)
		}
		u, err := filepath.Rel(out, outPath)
		if err != nil || strings.HasPrefix(u, "..") {
			return fmt.Errorf("bundle: %s is outside %s", outPath, out)
		}
		res.Assets[name] = "/" + filepath.ToSlash(u)
	}
	for _, want := range []string{"kit.css", "kit.js", "foundations.css", "site.css", "site.js", "prefs.js"} {
		if res.Assets[want] == "" {
			return fmt.Errorf("bundle: no output for %s", want)
		}
	}
	return nil
}

// foundationsCSS gives every token a class, so the Foundations page can show
// swatches, radii and shadows without inline styles (the site's CSP allows
// none).
func (s *Site) foundationsCSS() string {
	var b strings.Builder
	for _, t := range s.Tokens {
		n := t.Name
		switch {
		case strings.HasPrefix(n, "kit-shadow-"):
			fmt.Fprintf(&b, ".tk-%s{box-shadow:var(--%s)}\n", n, n)
		case strings.HasPrefix(n, "kit-radius-"):
			fmt.Fprintf(&b, ".tk-%s{border-radius:var(--%s)}\n", n, n)
		case strings.HasPrefix(n, "kit-text-"):
			fmt.Fprintf(&b, ".tk-%s{font-size:var(--%s)}\n", n, n)
		case strings.HasPrefix(n, "kit-space-"), strings.HasPrefix(n, "kit-control"):
			fmt.Fprintf(&b, ".tk-%s{inline-size:var(--%s)}\n", n, n)
		case strings.HasPrefix(n, "kit-font-"):
			fmt.Fprintf(&b, ".tk-%s{font-family:var(--%s)}\n", n, n)
		case isColour(t.Value):
			fmt.Fprintf(&b, ".tk-%s{background:var(--%s)}\n", n, n)
		}
	}
	return b.String()
}

// emptyDir makes out an empty folder, keeping the folder itself so a server
// holding it open (kit site serve) keeps serving across rebuilds.
func emptyDir(out string) error {
	if err := os.MkdirAll(out, 0o755); err != nil {
		return err
	}
	entries, err := os.ReadDir(out)
	if err != nil {
		return err
	}
	for _, e := range entries {
		if err := os.RemoveAll(filepath.Join(out, e.Name())); err != nil {
			return err
		}
	}
	return nil
}

func buildErr(errs []api.Message) error {
	var msgs []string
	for _, e := range errs {
		loc := ""
		if e.Location != nil {
			loc = fmt.Sprintf("%s:%d: ", e.Location.File, e.Location.Line)
		}
		msgs = append(msgs, loc+e.Text)
	}
	return errors.New("bundle: " + strings.Join(msgs, "; "))
}

func isColour(v string) bool {
	return strings.HasPrefix(v, "#") || strings.HasPrefix(v, "rgb")
}

func (s *Site) templates() (map[string]*template.Template, error) {
	dir := filepath.Join(s.Root, "site", "templates")
	funcs := template.FuncMap{
		"isColour": isColour,
		"inc":      func(i int) int { return i + 1 },
		"year":     func() int { return time.Now().Year() },
	}
	shared, err := filepath.Glob(filepath.Join(dir, "_*.gohtml"))
	if err != nil {
		return nil, err
	}
	out := map[string]*template.Template{}
	for _, name := range []string{"home", "foundations", "group", "component", "theme", "notfound"} {
		files := append(slices.Clone(shared), filepath.Join(dir, name+".gohtml"))
		t, err := template.New(name).Funcs(funcs).ParseFiles(files...)
		if err != nil {
			return nil, err
		}
		out[name] = t
	}
	return out, nil
}

// themePage parses a theme's full page with the bare layout.
func (s *Site) themePage(t *Theme, pg *ThemePage) (*template.Template, error) {
	dir := filepath.Join(s.Root, "site", "templates")
	files := []string{filepath.Join(dir, "_bare.gohtml"), filepath.Join(s.Root, "site", "themes", t.ID, "pages", pg.Slug+".gohtml")}
	return template.New(pg.Slug).Funcs(template.FuncMap{"year": func() int { return time.Now().Year() }}).ParseFiles(files...)
}

func writeSitemap(out, baseURL string, pages []string) error {
	var b strings.Builder
	b.WriteString(`<?xml version="1.0" encoding="UTF-8"?>` + "\n" + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` + "\n")
	for _, p := range pages {
		if p == "/404.html" {
			continue
		}
		fmt.Fprintf(&b, "  <url><loc>%s%s</loc></url>\n", baseURL, p)
	}
	b.WriteString("</urlset>\n")
	return os.WriteFile(filepath.Join(out, "sitemap.xml"), []byte(b.String()), 0o644)
}

// gzipAll writes a .gz beside every text file, for nginx's gzip_static. It
// works through os.Root, so nothing outside out can be read or written.
func gzipAll(out string) error {
	root, err := os.OpenRoot(out)
	if err != nil {
		return err
	}
	defer root.Close()
	text := []string{".html", ".css", ".js", ".svg", ".xml", ".json", ".txt"}
	return fs.WalkDir(root.FS(), ".", func(path string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() || !slices.Contains(text, filepath.Ext(path)) {
			return err
		}
		b, err := root.ReadFile(path)
		if err != nil {
			return err
		}
		var buf bytes.Buffer
		zw, err := gzip.NewWriterLevel(&buf, gzip.BestCompression)
		if err != nil {
			return err
		}
		if _, err := zw.Write(b); err != nil {
			return err
		}
		if err := zw.Close(); err != nil {
			return err
		}
		if buf.Len() >= len(b) {
			return nil
		}
		return root.WriteFile(path+".gz", buf.Bytes(), 0o644)
	})
}
