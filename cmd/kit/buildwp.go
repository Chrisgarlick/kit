package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"slices"

	"github.com/Chrisgarlick/kit/internal/sections"
	"github.com/Chrisgarlick/kit/internal/site"
)

// buildWP writes kit's sections as WordPress blocks for the kit Blocks
// plugin: <out>/sections/<name>/ for each section, and <out>/kit/ with the
// runtime (kit.php) and the CSS the sections stand on (tokens, fonts, and the
// components their READMEs list under uses). With -fixtures it also writes every demo with the HTML
// kit renders for it, for the plugin's tests.
func buildWP(args []string) error {
	fl := flag.NewFlagSet("build-wp", flag.ExitOnError)
	root := fl.String("root", ".", "the kit repository")
	out := fl.String("out", "", "the plugin's build folder")
	fixtures := fl.String("fixtures", "", "a JSON file to write the demos and their HTML to")
	_ = fl.Parse(args)
	if *out == "" {
		return errors.New("usage: kit build-wp -out <plugin build folder> [-fixtures <file.json>]")
	}
	secs, err := sections.Load(filepath.Join(*root, "sections"))
	if err != nil {
		return err
	}
	// The generated folders are kit's: start them afresh, so a removed
	// section doesn't linger.
	for _, d := range []string{"sections", "kit"} {
		if err := os.RemoveAll(filepath.Join(*out, d)); err != nil {
			return err
		}
	}
	var all []sections.Fixture
	for _, s := range secs {
		if err := s.WordPress(filepath.Join(*out, "sections")); err != nil {
			return fmt.Errorf("%s: %w", s.Name, err)
		}
		f, err := s.Fixtures()
		if err != nil {
			return err
		}
		all = append(all, f...)
		fmt.Println("block kit/" + s.Name)
	}
	st, err := site.Load(*root)
	if err != nil {
		return err
	}
	kitDir := filepath.Join(*out, "kit")
	// kit.css: the components the sections use (their READMEs' uses).
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
	if err := os.WriteFile(filepath.Join(kitDir, "kit.php"), []byte(sections.Runtime), 0o644); err != nil { //nolint:gosec // plugin source
		return err
	}
	// The site settings, which bound fields fall back to.
	site, err := sections.LoadSettings(filepath.Join(*root, "settings", "site.schema.json"))
	if err != nil {
		return err
	}
	if err := sections.CheckBinds(secs, site); err != nil {
		return err
	}
	sb, err := os.ReadFile(filepath.Join(*root, "settings", "site.schema.json"))
	if err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(kitDir, "site.schema.json"), sb, 0o644); err != nil { //nolint:gosec // plugin source
		return err
	}
	// The icon names, for the editor's icon fields.
	names, err := json.Marshal(sections.IconNames)
	if err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(kitDir, "icons.json"), append(names, '\n'), 0o644); err != nil { //nolint:gosec // plugin source
		return err
	}
	fmt.Printf("kit %s: kit.css, kit.php\n", res.Version)
	if *fixtures != "" {
		b, err := json.MarshalIndent(all, "", "  ")
		if err != nil {
			return err
		}
		if err := os.MkdirAll(filepath.Dir(*fixtures), 0o755); err != nil {
			return err
		}
		if err := os.WriteFile(*fixtures, append(b, '\n'), 0o644); err != nil { //nolint:gosec // test data
			return err
		}
		fmt.Println("fixtures", *fixtures)
	}
	return nil
}
