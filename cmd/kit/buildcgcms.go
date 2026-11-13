package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"slices"
	"strings"

	"github.com/Chrisgarlick/kit/internal/sections"
	"github.com/Chrisgarlick/kit/internal/site"
)

// buildCgCms writes kit's sections as cg-cms blocks into <out>:
//
//	kit-blocks.php                 the Block definitions, one kit-<name> per section
//	views/<name>.blade.php         each block's view: kit_cgcms_block('<name>', $data)
//	sections/<name>/<name>.php     the compiled template
//	sections/<name>/schema.json    the schema kit_content() sanitises and fills with
//	sections/<name>/style.css      the section's CSS
//	kit/kit.php, kit/cgcms.php     kit's runtime, and the cg-cms glue on top of it
//	kit/kit.css, kit/fonts/        tokens, fonts and the components the sections use
//	kit/site.schema.json           the site's details, which bound fields show
//	kit/icons.json                 the icon names
//	VERSION                        the kit commit
//
// With -fixtures it also writes every demo as cg-cms stores a block, with the
// HTML kit renders for it, for the app's tests. With -check it writes nothing
// and fails if <out> (and the fixtures) aren't what it would write.
func buildCgCms(args []string) error {
	fl := flag.NewFlagSet("build-cgcms", flag.ExitOnError)
	root := fl.String("root", ".", "the kit repository")
	out := fl.String("out", "", "the folder in the app to write the blocks to")
	fixtures := fl.String("fixtures", "", "a JSON file to write the demos and their HTML to")
	check := fl.Bool("check", false, "write nothing; fail if the output is out of date")
	_ = fl.Parse(args)
	if *out == "" {
		return errors.New("usage: kit build-cgcms -out <folder> [-fixtures <file.json>] [-check]")
	}
	if !*check {
		return writeCgCms(*root, *out, *fixtures, true)
	}
	tmp, err := os.MkdirTemp("", "kit-cgcms-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(tmp)
	fx := ""
	if *fixtures != "" {
		fx = filepath.Join(tmp, "fixtures.json")
	}
	if err := writeCgCms(*root, filepath.Join(tmp, "out"), fx, false); err != nil {
		return err
	}
	stale, err := diffTrees(filepath.Join(tmp, "out"), *out, "VERSION", "kit/VERSION")
	if err != nil {
		return err
	}
	if fx != "" {
		want, _ := os.ReadFile(fx)
		if have, err := os.ReadFile(*fixtures); err != nil || !bytes.Equal(have, want) {
			stale = append(stale, *fixtures)
		}
	}
	if len(stale) > 0 {
		return fmt.Errorf("out of date, run kit build-cgcms: %s", strings.Join(stale, ", "))
	}
	fmt.Println("kit blocks for cg-cms are up to date in", *out)
	return nil
}

func writeCgCms(root, out, fixtures string, verbose bool) error {
	secs, err := sections.Load(filepath.Join(root, "sections"))
	if err != nil {
		return err
	}
	siteSchema, err := sections.LoadSettings(filepath.Join(root, "settings", "site.schema.json"))
	if err != nil {
		return err
	}
	if err := sections.CheckBinds(secs, siteSchema); err != nil {
		return err
	}
	// The generated folders are kit's: start them afresh, so a removed
	// section doesn't linger.
	for _, d := range []string{"sections", "views", "kit"} {
		if err := os.RemoveAll(filepath.Join(out, d)); err != nil {
			return err
		}
	}
	var blocks []string
	var all []sections.CgCmsFixture
	for _, s := range secs {
		b, err := s.CgCms(out, siteSchema)
		if err != nil {
			return fmt.Errorf("%s: %w", s.Name, err)
		}
		blocks = append(blocks, b)
		f, err := s.CgCmsFixtures()
		if err != nil {
			return err
		}
		all = append(all, f...)
		if verbose {
			fmt.Println("block kit-" + s.Name)
		}
	}
	st, err := site.Load(root)
	if err != nil {
		return err
	}
	kitDir := filepath.Join(out, "kit")
	var css []string
	for _, c := range st.Components {
		if c.Section != nil {
			css = append(css, c.Uses...)
		}
	}
	slices.Sort(css)
	res, err := st.Dist(kitDir, site.DistOptions{CSS: slices.Compact(css), Fonts: true, NoJS: true})
	if err != nil {
		return err
	}
	siteJSON, err := os.ReadFile(filepath.Join(root, "settings", "site.schema.json"))
	if err != nil {
		return err
	}
	icons, err := json.Marshal(sections.IconNames)
	if err != nil {
		return err
	}
	files := map[string][]byte{
		"kit-blocks.php":       []byte(sections.CgCmsBlocksFile(blocks)),
		"kit/kit.php":          []byte(sections.Runtime),
		"kit/cgcms.php":        []byte(sections.CgCmsRuntime),
		"kit/site.schema.json": siteJSON,
		"kit/icons.json":       append(icons, '\n'),
		"VERSION":              []byte(res.Version + "\n"),
	}
	for name, b := range files {
		if err := os.WriteFile(filepath.Join(out, name), b, 0o644); err != nil { //nolint:gosec // app source files
			return err
		}
	}
	if verbose {
		fmt.Printf("kit %s: kit-blocks.php, kit.css, kit.php\n", res.Version)
	}
	if fixtures != "" {
		b, err := json.MarshalIndent(all, "", "  ")
		if err != nil {
			return err
		}
		if err := os.MkdirAll(filepath.Dir(fixtures), 0o755); err != nil {
			return err
		}
		if err := os.WriteFile(fixtures, append(b, '\n'), 0o644); err != nil { //nolint:gosec // test data
			return err
		}
		if verbose {
			fmt.Println("fixtures", fixtures)
		}
	}
	return nil
}

// diffTrees lists the files that differ between want and have, or are in
// only one of them, but for the ones named in skip (relative, slash-separated).
// Only the folders kit writes are compared in have.
func diffTrees(want, have string, skip ...string) ([]string, error) {
	read := func(dir string) (map[string][]byte, error) {
		m := map[string][]byte{}
		for _, top := range []string{"kit-blocks.php", "VERSION", "sections", "views", "kit"} {
			err := filepath.WalkDir(filepath.Join(dir, top), func(p string, d fs.DirEntry, err error) error {
				if errors.Is(err, fs.ErrNotExist) {
					return nil
				}
				if err != nil || d.IsDir() {
					return err
				}
				rel, _ := filepath.Rel(dir, p)
				rel = filepath.ToSlash(rel)
				if slices.Contains(skip, rel) {
					return nil
				}
				b, err := os.ReadFile(p)
				m[rel] = b
				return err
			})
			if err != nil {
				return nil, err
			}
		}
		return m, nil
	}
	w, err := read(want)
	if err != nil {
		return nil, err
	}
	h, err := read(have)
	if err != nil {
		return nil, err
	}
	var out []string
	for name, b := range w {
		if hb, ok := h[name]; !ok || !bytes.Equal(b, hb) {
			out = append(out, name)
		}
	}
	for name := range h {
		if _, ok := w[name]; !ok {
			out = append(out, name)
		}
	}
	slices.Sort(out)
	return out, nil
}
