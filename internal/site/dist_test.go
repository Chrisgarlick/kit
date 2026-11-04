package site

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestDist(t *testing.T) {
	s, err := Load("../..")
	if err != nil {
		t.Fatal(err)
	}
	out := t.TempDir()
	res, err := s.Dist(out, DistOptions{
		Bundles: map[string][]string{"kit": {"tabs", "menu", "tabs"}, "charts": {"sparkline"}},
		CSS:     []string{"button"},
	})
	if err != nil {
		t.Fatal(err)
	}
	if strings.Join(res.Bundles["kit"], ",") != "menu,tabs" {
		t.Errorf("kit bundle = %v, want menu and tabs once each", res.Bundles["kit"])
	}
	css, _ := os.ReadFile(filepath.Join(out, "kit.css"))
	js, _ := os.ReadFile(filepath.Join(out, "kit.js"))
	charts, _ := os.ReadFile(filepath.Join(out, "charts.js"))
	if !strings.Contains(string(css), "--kit-accent") || strings.Contains(string(css), "@font-face") {
		t.Error("kit.css should carry the tokens and no fonts")
	}
	if !strings.Contains(string(css), ".kit-button") || strings.Contains(string(css), ".kit-colour") {
		t.Error("kit.css should hold only the chosen components' CSS")
	}
	if !strings.Contains(string(js), "kit-tabs") || strings.Contains(string(js), "kit-sparkline") || !strings.Contains(string(charts), "kit-sparkline") {
		t.Error("each bundle should hold only its own components")
	}
	// The bundles share the core as one chunk.
	chunks, _ := filepath.Glob(filepath.Join(out, "kit-core-*.js"))
	if len(chunks) != 1 || !strings.Contains(string(js), filepath.Base(chunks[0])) || !strings.Contains(string(charts), filepath.Base(chunks[0])) {
		t.Errorf("want one shared core chunk imported by both bundles, got %v", chunks)
	}
	v, _ := os.ReadFile(filepath.Join(out, "VERSION"))
	if !strings.HasPrefix(string(v), res.Version+"\n") {
		t.Errorf("VERSION = %q", v)
	}
	for _, bad := range []DistOptions{
		{Bundles: map[string][]string{"kit": {"button"}}}, // tier 1 has no JS
		{Bundles: map[string][]string{"kit": {"nope"}}},
		{Bundles: map[string][]string{"Kit!": {"tabs"}}},
		{CSS: []string{"nope"}},
	} {
		if _, err := s.Dist(t.TempDir(), bad); err == nil {
			t.Errorf("%+v should be an error", bad)
		}
	}
	cssOnly := t.TempDir()
	if _, err := s.Dist(cssOnly, DistOptions{NoJS: true, CSS: []string{"button"}}); err != nil {
		t.Fatal(err)
	}
	if m, _ := filepath.Glob(filepath.Join(cssOnly, "*.js")); len(m) > 0 {
		t.Errorf("-no-js wrote %v", m)
	}
	if b, _ := os.ReadFile(filepath.Join(cssOnly, "kit.css")); strings.Contains(string(b), "kit-command") {
		t.Error("-no-js should carry only the named components' CSS")
	}
	if _, err := s.Dist(t.TempDir(), DistOptions{NoJS: true, Bundles: map[string][]string{"kit": {"tabs"}}}); err == nil {
		t.Error("-no-js with bundles should be an error")
	}
	fonts := t.TempDir()
	if _, err := s.Dist(fonts, DistOptions{Bundles: map[string][]string{"kit": {"tabs"}}, Fonts: true}); err != nil {
		t.Fatal(err)
	}
	if m, _ := filepath.Glob(filepath.Join(fonts, "fonts", "*.woff2")); len(m) == 0 {
		t.Error("-fonts should write the woff2 files")
	}
}
