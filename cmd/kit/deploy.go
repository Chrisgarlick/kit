package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path"
	"regexp"
	"strings"
	"time"

	"github.com/Chrisgarlick/kit/internal/site"
)

// The server layout deploy works with:
//
//	<dir>/releases/<id>/   one built site per deploy
//	<dir>/current          a symlink nginx serves, switched in one rename
var safeArg = regexp.MustCompile(`^[A-Za-z0-9._@:/-]+$`)

// deploy builds the site and ships it to a static web server over SSH:
// rsync into a new release folder, then an atomic switch of the `current`
// symlink, keeping the newest few releases for -rollback.
func deploy(args []string) error {
	fl := flag.NewFlagSet("site deploy", flag.ExitOnError)
	root := fl.String("root", ".", "the kit repository")
	host := fl.String("host", "chrisgarlick-server", "SSH host (an alias from ~/.ssh/config works)")
	dir := fl.String("dir", "/var/www/ui", "the site's folder on the server")
	base := fl.String("base", "https://ui.chrisgarlick.com", "public origin, for the build and the check afterwards")
	keep := fl.Int("keep", 5, "releases to keep")
	rollback := fl.Bool("rollback", false, "point current back at the previous release instead of deploying")
	_ = fl.Parse(args)

	for _, a := range []string{*host, *dir} {
		if !safeArg.MatchString(a) {
			return fmt.Errorf("refusing unusual host or folder %q", a)
		}
	}
	if *keep < 2 {
		return errors.New("-keep must be at least 2, so there is something to roll back to")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()
	remote := func(script string) (string, error) {
		out, err := exec.CommandContext(ctx, "ssh", *host, "set -euo pipefail; "+script).CombinedOutput() //nolint:gosec // host and dir are checked above
		return strings.TrimSpace(string(out)), err
	}

	if *rollback {
		out, err := remote(fmt.Sprintf(`cd %[1]s/releases
cur=$(basename "$(readlink -f %[1]s/current)")
prev=$(ls -1 | sort | awk -v c="$cur" '$0 < c' | tail -1)
[ -n "$prev" ] || { echo "no release before $cur"; exit 1; }
ln -sfn "releases/$prev" %[1]s/current.next && mv -T %[1]s/current.next %[1]s/current
echo "$cur -> $prev"`, *dir))
		if err != nil {
			return fmt.Errorf("rollback: %s: %w", out, err)
		}
		fmt.Println("Rolled back:", out)
		return check(ctx, *base)
	}

	s, err := site.Load(*root)
	if err != nil {
		return err
	}
	out, err := os.MkdirTemp("", "kit-deploy-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(out)
	res, err := s.Build(out, site.Options{BaseURL: *base})
	if err != nil {
		return err
	}

	id := time.Now().UTC().Format("20060102-150405")
	if sha, err := exec.CommandContext(ctx, "git", "-C", *root, "rev-parse", "--short", "HEAD").Output(); err == nil {
		id += "-" + strings.TrimSpace(string(sha))
	}
	release := path.Join(*dir, "releases", id)
	if o, err := remote("mkdir -p " + release); err != nil {
		return fmt.Errorf("%s: %w", o, err)
	}
	// Readable by the web server whatever the local umask was.
	rs := exec.CommandContext(ctx, "rsync", "-a", "--delete", "--chmod=D755,F644", out+"/", *host+":"+release+"/") //nolint:gosec // checked above
	rs.Stdout, rs.Stderr = os.Stdout, os.Stderr
	if err := rs.Run(); err != nil {
		return fmt.Errorf("rsync: %w", err)
	}
	o, err := remote(fmt.Sprintf(`ln -sfn releases/%[2]s %[1]s/current.next && mv -T %[1]s/current.next %[1]s/current
cd %[1]s/releases && ls -1 | sort | head -n -%[3]d | xargs -r rm -rf --
ls -1 | wc -l`, *dir, id, *keep))
	if err != nil {
		return fmt.Errorf("switching to %s: %s: %w", id, o, err)
	}
	fmt.Printf("Deployed %s (%d pages) to %s:%s; %s releases kept\n", id, len(res.Pages), *host, *dir, o)
	return check(ctx, *base)
}

// check fetches the live home page and reports its status.
func check(ctx context.Context, base string) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, base+"/", nil)
	if err != nil {
		return err
	}
	resp, err := (&http.Client{Timeout: 15 * time.Second}).Do(req)
	if err != nil {
		fmt.Println("  (couldn't check the live site:", err, ")")
		return nil
	}
	resp.Body.Close()
	fmt.Printf("  %s/ answered %d\n", base, resp.StatusCode)
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("%s/ answered %d", base, resp.StatusCode)
	}
	return nil
}
