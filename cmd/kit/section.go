package main

import (
	"bytes"
	"errors"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strings"

	"github.com/Chrisgarlick/kit/internal/sections"
)

// sectionCmd is `kit section check|compile|export`: website sections.
func sectionCmd(args []string) error {
	if len(args) == 0 {
		return errors.New("usage: kit section check | compile [-check] | export -target blade|php -out <dir> <name>...")
	}
	fl := flag.NewFlagSet("section "+args[0], flag.ExitOnError)
	root := fl.String("root", ".", "the kit repository")
	switch args[0] {
	case "check":
		_ = fl.Parse(args[1:])
		secs, err := sections.Load(filepath.Join(*root, "sections"))
		if err != nil {
			return err
		}
		site, err := sections.LoadSettings(filepath.Join(*root, "settings", "site.schema.json"))
		if err != nil {
			return err
		}
		if err := sections.CheckBinds(secs, site); err != nil {
			return err
		}
		for _, s := range secs {
			fmt.Printf("  %-12s %d fields, %d variants, %d demos\n", s.Name, len(s.Schema.Fields), len(s.Schema.Variants), len(s.Demos))
		}
		fmt.Printf("%d sections: templates, schemas and demos agree, and every bound field matches a site setting\n", len(secs))
		return nil

	case "compile":
		check := fl.Bool("check", false, "don't write; fail if a compiled .php is out of date")
		_ = fl.Parse(args[1:])
		secs, err := sections.Load(filepath.Join(*root, "sections"))
		if err != nil {
			return err
		}
		var stale []string
		for _, s := range secs {
			p := filepath.Join(s.Dir, s.Name+".php")
			body := []byte(s.Template.PHP("sections/" + s.Name + "/" + s.Name + ".blade.php"))
			if *check {
				if have, err := os.ReadFile(p); err != nil || !bytes.Equal(have, body) {
					stale = append(stale, p)
				}
				continue
			}
			if err := os.WriteFile(p, body, 0o644); err != nil { //nolint:gosec // source files
				return err
			}
			fmt.Println("wrote", p)
		}
		if len(stale) > 0 {
			return fmt.Errorf("out of date (run kit section compile): %s", strings.Join(stale, ", "))
		}
		return nil

	case "export":
		target := fl.String("target", "", "blade (Laravel, cg-cms, WordPress with Blade) or php (plain PHP)")
		out := fl.String("out", "", "the project folder to write into")
		_ = fl.Parse(args[1:])
		if !slices.Contains(sections.Targets, *target) || *out == "" || fl.NArg() == 0 {
			return errors.New("usage: kit section export -target blade|php -out <dir> <name>...")
		}
		secs, err := sections.Load(filepath.Join(*root, "sections"))
		if err != nil {
			return err
		}
		for _, name := range fl.Args() {
			i := slices.IndexFunc(secs, func(s *sections.Section) bool { return s.Name == name })
			if i < 0 {
				return fmt.Errorf("no section %q", name)
			}
			files, err := secs[i].Export(*target, *out)
			if err != nil {
				return err
			}
			for _, f := range files {
				fmt.Println("wrote", f)
			}
		}
		return nil
	}
	return fmt.Errorf("kit section %s: unknown; check, compile or export", args[0])
}
