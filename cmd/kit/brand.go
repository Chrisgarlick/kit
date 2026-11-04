package main

import (
	"bytes"
	"errors"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/Chrisgarlick/kit/internal/brand"
)

// brandCmd turns each folder's brand.yaml (and kit.yaml) into tokens.css,
// tokens.typ and tokens.json beside it. With -check it only reports folders
// whose files are out of date. Contrast failures stop it either way.
func brandCmd(args []string) error {
	fl := flag.NewFlagSet("brand", flag.ExitOnError)
	check := fl.Bool("check", false, "don't write; fail if the generated files are out of date")
	_ = fl.Parse(args)
	dirs := fl.Args()
	if len(dirs) == 0 {
		return errors.New("usage: kit brand [-check] <folder with brand.yaml> [more folders]")
	}
	var stale []string
	for _, dir := range dirs {
		out, err := brand.Generate(dir)
		if err != nil {
			return fmt.Errorf("%s: %w", dir, err)
		}
		for name, body := range out {
			p := filepath.Join(dir, name)
			if *check {
				if have, err := os.ReadFile(p); err != nil || !bytes.Equal(have, body) {
					stale = append(stale, p)
				}
				continue
			}
			if err := os.WriteFile(p, body, 0o644); err != nil {
				return err
			}
			fmt.Println("wrote", p)
		}
	}
	if len(stale) > 0 {
		return fmt.Errorf("out of date (run kit brand): %s", strings.Join(stale, ", "))
	}
	return nil
}
