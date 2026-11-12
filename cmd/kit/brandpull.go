package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/Chrisgarlick/kit/internal/brand"
)

// brandPull is `kit brand pull <client> [-into folder]`: the one step that
// talks to Clients. It fetches the client's published brand and its font and
// logo files into a folder the site keeps in its repository, then builds the
// tokens from it, so the site never needs Clients again until the brand
// changes and someone pulls it again.
//
// Clients' API is reachable only on the Kritano box, so the pull opens an ssh
// tunnel there for its length, as Motion does, with the same defaults:
// ~/.kit/config.json (or ~/.motion/config.json) can set {"ssh", "ssh_key",
// "clients_port"}, and the service key comes from $KIT_CLIENTS_KEY,
// ~/.kit/clients.key or ~/.motion/clients.key. -url skips the tunnel (on the
// box, or for a test server).
func brandPull(args []string) error {
	fl := flag.NewFlagSet("brand pull", flag.ExitOnError)
	into := fl.String("into", "brand", "the folder to keep the brand in (in the site's repository)")
	base := fl.String("url", "", "Clients' API, without a tunnel (e.g. http://127.0.0.1:8130 on the box)")
	_ = fl.Parse(reorder(args))
	if fl.NArg() != 1 {
		return errors.New("usage: kit brand pull <client> [-into folder] [-url http://…]")
	}
	client := fl.Arg(0)
	key, err := clientsKey()
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()
	if *base == "" {
		port, stop, err := tunnel(ctx)
		if err != nil {
			return err
		}
		defer stop()
		*base = fmt.Sprintf("http://127.0.0.1:%d", port)
	}
	res, err := brand.Pull(ctx, brand.Source{BaseURL: *base, Key: key}, client, *into, time.Now())
	if err != nil {
		return err
	}
	switch {
	case res.Unchanged:
		fmt.Printf("%s: version %d, already up to date in %s\n", client, res.To, *into)
		return nil
	case res.From == 0:
		fmt.Printf("%s: version %d pulled into %s\n", client, res.To, *into)
	default:
		fmt.Printf("%s: version %d → %d\n", client, res.From, res.To)
		for _, c := range res.Changes {
			fmt.Println("  " + c)
		}
	}
	for _, f := range res.Written {
		fmt.Println("  wrote " + filepath.Join(*into, f))
	}
	for _, f := range res.Removed {
		fmt.Println("  removed " + filepath.Join(*into, f) + " (no longer in the brand)")
	}
	if len(res.NotPulled) > 0 {
		fmt.Printf("  not files in its library, so not pulled: %s (the site serves these fonts, or the fallback applies)\n", strings.Join(res.NotPulled, ", "))
	}
	// Then build the tokens from what's now local.
	return brandCmd([]string{*into})
}

// reorder puts flags before the client's slug, so `kit brand pull acme -into x` works.
func reorder(args []string) []string {
	var flags, rest []string
	for i := 0; i < len(args); i++ {
		if strings.HasPrefix(args[i], "-") {
			flags = append(flags, args[i])
			if !strings.Contains(args[i], "=") && i+1 < len(args) {
				flags = append(flags, args[i+1])
				i++
			}
			continue
		}
		rest = append(rest, args[i])
	}
	return append(flags, rest...)
}

type sshConfig struct {
	SSH         string `json:"ssh"`
	SSHKey      string `json:"ssh_key"`
	ClientsPort int    `json:"clients_port"`
}

func home(p string) string {
	if rest, ok := strings.CutPrefix(p, "~/"); ok {
		h, _ := os.UserHomeDir()
		return filepath.Join(h, rest)
	}
	return p
}

func loadSSHConfig() sshConfig {
	c := sshConfig{SSH: "root@167.71.134.177", SSHKey: "~/.ssh/keys/kritano", ClientsPort: 8130}
	for _, p := range []string{"~/.kit/config.json", "~/.motion/config.json"} {
		b, err := os.ReadFile(home(p))
		if err != nil {
			continue
		}
		var o sshConfig
		if json.Unmarshal(b, &o) == nil {
			if o.SSH != "" {
				c.SSH = o.SSH
			}
			if o.SSHKey != "" {
				c.SSHKey = o.SSHKey
			}
			if o.ClientsPort != 0 {
				c.ClientsPort = o.ClientsPort
			}
		}
		break
	}
	return c
}

func clientsKey() (string, error) {
	if k := strings.TrimSpace(os.Getenv("KIT_CLIENTS_KEY")); k != "" {
		return k, nil
	}
	for _, p := range []string{"~/.kit/clients.key", "~/.motion/clients.key"} {
		if b, err := os.ReadFile(home(p)); err == nil {
			if k := strings.TrimSpace(string(b)); k != "" {
				return k, nil
			}
		}
	}
	return "", errors.New("no Clients key: create a service key on the Kritano box (clients-admin keys create kit-mac --kind service) and save it in ~/.kit/clients.key (chmod 600), or set KIT_CLIENTS_KEY")
}

// tunnel forwards a free local port to Clients on the box for the pull's length.
func tunnel(ctx context.Context) (int, func(), error) {
	c := loadSSHConfig()
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, nil, err
	}
	port := l.Addr().(*net.TCPAddr).Port
	l.Close()
	cmd := exec.CommandContext(ctx, "ssh", "-N", "-o", "BatchMode=yes", "-o", "ExitOnForwardFailure=yes", "-o", "ConnectTimeout=10",
		"-i", home(c.SSHKey), "-L", fmt.Sprintf("127.0.0.1:%d:127.0.0.1:%d", port, c.ClientsPort), c.SSH)
	var stderr strings.Builder
	cmd.Stderr = &stderr
	cmd.Stdout = io.Discard
	if err := cmd.Start(); err != nil {
		return 0, nil, fmt.Errorf("starting ssh: %w", err)
	}
	stop := func() { _ = cmd.Process.Kill(); _ = cmd.Wait() }
	exited := make(chan error, 1)
	go func() { exited <- cmd.Wait() }()
	deadline := time.Now().Add(15 * time.Second)
	for time.Now().Before(deadline) {
		if conn, err := net.DialTimeout("tcp", fmt.Sprintf("127.0.0.1:%d", port), 200*time.Millisecond); err == nil {
			conn.Close()
			return port, func() { _ = cmd.Process.Kill(); <-exited }, nil
		}
		select {
		case err := <-exited:
			return 0, nil, fmt.Errorf("ssh to %s failed (%v): %s", c.SSH, err, strings.TrimSpace(stderr.String()))
		case <-time.After(150 * time.Millisecond):
		}
	}
	stop()
	return 0, nil, fmt.Errorf("ssh to %s: the tunnel didn't open in 15s", c.SSH)
}
