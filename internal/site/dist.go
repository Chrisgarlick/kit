package site

import (
	"context"
	"fmt"
	"maps"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"strings"
	"time"

	"github.com/evanw/esbuild/pkg/api"
)

// DistOptions picks what goes into a build for an app.
type DistOptions struct {
	// Bundles maps a bundle name (kit, charts…) to the tier 2 components in
	// it, by slug. Bundles share one copy of the core (a chunk), so a page
	// loads only the bundles it needs. Empty means one bundle, kit, with
	// every tier 2 component.
	Bundles map[string][]string
	// CSS lists the components whose CSS goes into kit.css, besides those in
	// the bundles. Empty means every component.
	CSS []string
	// Fonts adds kit's typefaces (fonts.css and the woff2 files). Apps with
	// their own fonts leave it off and set the --kit-font-* tokens.
	Fonts bool
}

// DistResult lists what Dist wrote, with sizes.
type DistResult struct {
	Version string
	Files   map[string]int      // name -> bytes
	Bundles map[string][]string // name -> components, sorted
}

// Dist writes kit for use in another app: kit.css (tokens and component
// CSS), one ES module per bundle (kit.js, charts.js…) sharing a kit-core
// chunk, and VERSION (the kit commit and each bundle's components). Entry
// names aren't hashed: the app versions its own asset URLs.
func (s *Site) Dist(out string, opt DistOptions) (*DistResult, error) {
	res := &DistResult{Files: map[string]int{}}
	known := map[string]*Component{}
	for _, c := range s.Components {
		known[c.Slug] = c
	}
	bundles := opt.Bundles
	if len(bundles) == 0 {
		var all []string
		for _, c := range s.Components {
			if len(c.JS) > 0 {
				all = append(all, c.Slug)
			}
		}
		bundles = map[string][]string{"kit": all}
	}
	res.Bundles = map[string][]string{}
	inCSS := map[string]bool{}
	for name, list := range bundles {
		if !validBundle(name) {
			return nil, fmt.Errorf("dist: bundle name %q: use lowercase letters, digits and dashes", name)
		}
		for _, slug := range list {
			c := known[slug]
			switch {
			case c == nil:
				return nil, fmt.Errorf("dist: no component %q", slug)
			case len(c.JS) == 0:
				return nil, fmt.Errorf("dist: %s has no JS (tier 1 is CSS only)", slug)
			}
			inCSS[slug] = true
		}
		list = slices.Clone(list)
		slices.Sort(list)
		res.Bundles[name] = slices.Compact(list)
	}
	for _, slug := range opt.CSS {
		if known[slug] == nil {
			return nil, fmt.Errorf("dist: no component %q", slug)
		}
		inCSS[slug] = true
	}

	gen, err := os.MkdirTemp("", "kit-dist-")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(gen)
	imp := func(b *strings.Builder, kind, f string) {
		fmt.Fprintf(b, "%s %q;\n", kind, filepath.ToSlash(filepath.Join(s.Root, f)))
	}
	var css strings.Builder
	css.WriteString("/* kit: tokens and components */\n")
	if opt.Fonts {
		imp(&css, "@import", "tokens/fonts.css")
	}
	imp(&css, "@import", "tokens/tokens.css")
	for _, c := range s.Components {
		if len(opt.CSS) > 0 && !inCSS[c.Slug] {
			continue
		}
		for _, f := range c.CSS {
			imp(&css, "@import", f)
		}
	}
	if err := os.WriteFile(filepath.Join(gen, "kit.css"), []byte(css.String()), 0o600); err != nil {
		return nil, err
	}
	cssEntry := []api.EntryPoint{{InputPath: filepath.Join(gen, "kit.css"), OutputPath: "kit"}}
	var jsEntries []api.EntryPoint
	names := slices.Sorted(maps.Keys(res.Bundles))
	for _, name := range names {
		var js strings.Builder
		js.WriteString("// kit: " + strings.Join(res.Bundles[name], ", ") + "\n")
		for _, slug := range res.Bundles[name] {
			for _, f := range known[slug].JS {
				imp(&js, "import", f)
			}
		}
		if err := os.WriteFile(filepath.Join(gen, name+".js"), []byte(js.String()), 0o600); err != nil {
			return nil, err
		}
		jsEntries = append(jsEntries, api.EntryPoint{InputPath: filepath.Join(gen, name+".js"), OutputPath: name})
	}
	var files []api.OutputFile
	for _, b := range []struct {
		entries []api.EntryPoint
		split   bool
	}{{cssEntry, false}, {jsEntries, true}} {
		r := api.Build(api.BuildOptions{
			EntryPointsAdvanced: b.entries,
			AbsWorkingDir:       s.Root,
			Bundle:              true,
			Splitting:           b.split,
			Write:               false,
			Outdir:              out,
			EntryNames:          "[name]",
			ChunkNames:          "kit-core-[hash]",
			AssetNames:          "fonts/[name]",
			Loader:              map[string]api.Loader{".woff2": api.LoaderFile, ".svg": api.LoaderFile},
			MinifyWhitespace:    true,
			MinifyIdentifiers:   true,
			MinifySyntax:        true,
			Format:              api.FormatESModule,
			Target:              api.ES2022,
			Platform:            api.PlatformBrowser,
			LegalComments:       api.LegalCommentsNone,
			LogLevel:            api.LogLevelSilent,
		})
		if len(r.Errors) > 0 {
			return nil, buildErr(r.Errors)
		}
		files = append(files, r.OutputFiles...)
	}
	if err := os.MkdirAll(out, 0o755); err != nil {
		return nil, err
	}
	// Old chunks would pile up in a vendored folder: clear them first.
	if old, _ := filepath.Glob(filepath.Join(out, "kit-core-*.js")); len(old) > 0 {
		for _, f := range old {
			_ = os.Remove(f)
		}
	}
	for _, f := range files {
		if err := os.MkdirAll(filepath.Dir(f.Path), 0o755); err != nil {
			return nil, err
		}
		if err := os.WriteFile(f.Path, f.Contents, 0o644); err != nil {
			return nil, err
		}
		if rel, err := filepath.Rel(out, f.Path); err == nil {
			res.Files[filepath.ToSlash(rel)] = len(f.Contents)
		}
	}
	res.Version = version(s.Root)
	v := res.Version + "\n"
	for _, name := range names {
		v += name + ": " + strings.Join(res.Bundles[name], ", ") + "\n"
	}
	if err := os.WriteFile(filepath.Join(out, "VERSION"), []byte(v), 0o644); err != nil {
		return nil, err
	}
	return res, nil
}

func validBundle(name string) bool {
	if name == "" || name == "kit-core" {
		return false
	}
	for _, r := range name {
		if (r < 'a' || r > 'z') && (r < '0' || r > '9') && r != '-' {
			return false
		}
	}
	return true
}

// version is the kit commit, with "+dirty" when the tree has changes.
func version(root string) string {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	head, err := exec.CommandContext(ctx, "git", "-C", root, "rev-parse", "--short", "HEAD").Output()
	if err != nil {
		return "unknown"
	}
	v := strings.TrimSpace(string(head))
	if st, err := exec.CommandContext(ctx, "git", "-C", root, "status", "--porcelain", "--", "core", "components", "tokens").Output(); err == nil && len(st) > 0 {
		v += "+dirty"
	}
	return v
}
