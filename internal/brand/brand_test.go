package brand

import (
	"bytes"
	"math"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestColour(t *testing.T) {
	c, err := ParseColour("#1E1B4B17")
	if err != nil || c.Hex() != "#1E1B4B17" {
		t.Fatalf("round trip: %v %v", c.Hex(), err)
	}
	if _, err := ParseColour("#abc"); err == nil {
		t.Error("three-digit hex should be refused (the brand format is #RRGGBB)")
	}
	if r := Contrast(mustColour("#000000"), mustColour("#FFFFFF")); math.Abs(r-21) > 0.01 {
		t.Errorf("black on white is %v, want 21", r)
	}
	// #767676 on white is the classic 4.54:1.
	if r := Contrast(mustColour("#767676"), mustColour("#FFFFFF")); math.Abs(r-4.54) > 0.01 {
		t.Errorf("#767676 on white is %v, want 4.54", r)
	}
	if got := Mix(mustColour("#000000"), mustColour("#FFFFFF"), 0.5).Hex(); got != "#808080" {
		t.Errorf("mix is %s", got)
	}
}

func TestFontName(t *testing.T) {
	for in, want := range map[string]string{"lib:instrument-serif": "Instrument Serif", "lib:outfit": "Outfit", "Inter Tight": "Inter Tight"} {
		if got := fontName(in); got != want {
			t.Errorf("fontName(%q) = %q, want %q", in, got, want)
		}
	}
}

func write(t *testing.T, files map[string]string) string {
	dir := t.TempDir()
	for n, b := range files {
		if err := os.WriteFile(filepath.Join(dir, n), []byte(b), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	return dir
}

const minimal = "brand: 1\nname: Test\npalette:\n  paper: \"#FFFFFF\"\n  ink: \"#111111\"\n  accent: \"#0B5FFF\"\n  good: \"#5CB85C\"\n"

func TestStrictAndRequired(t *testing.T) {
	if _, _, err := Load(write(t, map[string]string{"brand.yaml": minimal + "colour: blue\n"})); err == nil {
		t.Error("an unknown key should be an error, as the brand format says")
	}
	if _, _, err := Load(write(t, map[string]string{"brand.yaml": "brand: 1\nname: X\npalette:\n  paper: \"#FFFFFF\"\n"})); err == nil {
		t.Error("ink and accent are required")
	}
}

func TestContrastProblemsAndOverrides(t *testing.T) {
	// #5CB85C is about 2.4:1 on white: the check must catch it.
	_, err := Generate(write(t, map[string]string{"brand.yaml": minimal}))
	if err == nil || !strings.Contains(err.Error(), "light: good on surface") {
		t.Fatalf("want a contrast error for good, got %v", err)
	}
	// kit.yaml fixes it, and its other tokens come through.
	out, err := Generate(write(t, map[string]string{"brand.yaml": minimal, "kit.yaml": "both:\n  good: \"#1F7A4D\"\n  button-radius: 999px\n"}))
	if err != nil {
		t.Fatal(err)
	}
	css := string(out["tokens.css"])
	for _, want := range []string{"--kit-good: #1F7A4D;", "--kit-button-radius: 999px;", ":root[data-theme=\"dark\"]", "--kit-accent: #0B5FFF;"} {
		if !strings.Contains(css, want) {
			t.Errorf("tokens.css is missing %q", want)
		}
	}
	if !strings.Contains(string(out["tokens.typ"]), `"accent": rgb("#0B5FFF")`) {
		t.Error("tokens.typ is missing the accent")
	}
}

// The site's themes are generated: their files must match what kit brand writes now.
func TestSiteThemesUpToDate(t *testing.T) {
	dirs, _ := filepath.Glob(filepath.Join("..", "..", "site", "themes", "*", "brand.yaml"))
	if len(dirs) == 0 {
		t.Skip("no themes")
	}
	for _, f := range dirs {
		dir := filepath.Dir(f)
		out, err := Generate(dir)
		if err != nil {
			t.Fatalf("%s: %v", dir, err)
		}
		for name, body := range out {
			have, err := os.ReadFile(filepath.Join(dir, name))
			if err != nil || !bytes.Equal(have, body) {
				t.Errorf("%s/%s is out of date: run ./bin/kit brand %s", dir, name, dir)
			}
		}
	}
}
