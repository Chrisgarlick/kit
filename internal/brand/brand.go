// Package brand turns a Clients brand file (specs/brand.md in Motion, the
// format Typeset and Motion also read) into kit's design tokens, and writes
// them for kit (CSS custom properties), Typeset (a Typst dictionary) and
// Motion and the chart renderer (JSON). Roles the brand format doesn't have
// are derived by fixed rules; every text colour is checked against WCAG AA
// on the surfaces it's used on, in every mode.
package brand

import (
	"bytes"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"gopkg.in/yaml.v3"
)

// File is a brand file: format version 1. Sections kit doesn't use are kept
// as plain values, so the file still parses strictly.
type File struct {
	Brand     int                 `yaml:"brand"`
	Name      string              `yaml:"name"`
	Palette   Palette             `yaml:"palette"`
	Modes     map[string]Palette  `yaml:"modes"`
	Gradients map[string]any      `yaml:"gradients"`
	Patterns  map[string]any      `yaml:"patterns"`
	Type      map[string]TypeRole `yaml:"type"`
	Shape     Shape               `yaml:"shape"`
	Logos     map[string]string   `yaml:"logos"`
	Wordmark  string              `yaml:"wordmark"`
	Print     map[string]any      `yaml:"print"`
	Motion    map[string]any      `yaml:"motion"`
}

// Palette holds colour roles by name; a mode overrides any subset.
type Palette struct {
	Paper      string `yaml:"paper"`
	Surface    string `yaml:"surface"`
	Ink        string `yaml:"ink"`
	InkMuted   string `yaml:"ink-muted"`
	Heading    string `yaml:"heading"`
	Rule       string `yaml:"rule"`
	Accent     string `yaml:"accent"`
	AccentSoft string `yaml:"accent-soft"`
	Accent2    string `yaml:"accent-2"`
	OnAccent   string `yaml:"on-accent"`
	Inverse    string `yaml:"inverse"`
	OnInverse  string `yaml:"on-inverse"`
	Good       string `yaml:"good"`
	Fair       string `yaml:"fair"`
	Poor       string `yaml:"poor"`
}

// TypeRole is one of display, heading, body, mono.
type TypeRole struct {
	Font       string  `yaml:"font"`
	ItalicFont string  `yaml:"italic-font"`
	Weight     int     `yaml:"weight"`
	Tracking   string  `yaml:"tracking"`
	Leading    float64 `yaml:"leading"`
	Italic     bool    `yaml:"italic"`
}

// Shape is radius, shadow and stroke.
type Shape struct {
	Radius map[string]string `yaml:"radius"`
	Shadow struct {
		Color   string  `yaml:"color"`
		Opacity float64 `yaml:"opacity"`
		Blur    string  `yaml:"blur"`
		Y       string  `yaml:"y"`
	} `yaml:"shadow"`
	Stroke string `yaml:"stroke"`
}

// Overrides is kit.yaml, beside a brand file: token values kit should use
// instead of the derived ones, for choices the brand format can't express.
// Keys are token names without the --kit- prefix.
type Overrides struct {
	Light map[string]string `yaml:"light"`
	Dark  map[string]string `yaml:"dark"`
	Both  map[string]string `yaml:"both"`
}

// Load reads dir/brand.yaml strictly, and dir/kit.yaml if it's there.
func Load(dir string) (*File, *Overrides, error) {
	b, err := os.ReadFile(filepath.Join(dir, "brand.yaml"))
	if err != nil {
		return nil, nil, err
	}
	f := &File{}
	dec := yaml.NewDecoder(bytes.NewReader(b))
	dec.KnownFields(true)
	if err := dec.Decode(f); err != nil {
		return nil, nil, fmt.Errorf("brand.yaml: %w", err)
	}
	if f.Brand != 1 {
		return nil, nil, fmt.Errorf("brand.yaml: brand: %d is not a format kit knows (1)", f.Brand)
	}
	if f.Name == "" || f.Palette.Paper == "" || f.Palette.Ink == "" || f.Palette.Accent == "" {
		return nil, nil, errors.New("brand.yaml: name, palette.paper, palette.ink and palette.accent are required")
	}
	o := &Overrides{}
	if b, err := os.ReadFile(filepath.Join(dir, "kit.yaml")); err == nil {
		dec := yaml.NewDecoder(bytes.NewReader(b))
		dec.KnownFields(true)
		if err := dec.Decode(o); err != nil {
			return nil, nil, fmt.Errorf("kit.yaml: %w", err)
		}
	} else if !errors.Is(err, os.ErrNotExist) {
		return nil, nil, err
	}
	return f, o, nil
}

// mode returns the palette for a mode: the base, with the mode's roles over it.
func (f *File) mode(name string) Palette {
	p := f.Palette
	m, ok := f.Modes[name]
	if !ok {
		return p
	}
	for _, pair := range []struct {
		dst *string
		src string
	}{
		{&p.Paper, m.Paper}, {&p.Surface, m.Surface}, {&p.Ink, m.Ink}, {&p.InkMuted, m.InkMuted}, {&p.Heading, m.Heading},
		{&p.Rule, m.Rule}, {&p.Accent, m.Accent}, {&p.AccentSoft, m.AccentSoft}, {&p.Accent2, m.Accent2}, {&p.OnAccent, m.OnAccent},
		{&p.Inverse, m.Inverse}, {&p.OnInverse, m.OnInverse}, {&p.Good, m.Good}, {&p.Fair, m.Fair}, {&p.Poor, m.Poor},
	} {
		if pair.src != "" {
			*pair.dst = pair.src
		}
	}
	return p
}

// fontName turns "lib:instrument-serif" into "Instrument Serif"; a bundled
// family name ("Inter Tight") passes through.
func fontName(s string) string {
	if !strings.HasPrefix(s, "lib:") {
		return s
	}
	words := strings.Split(strings.TrimPrefix(s, "lib:"), "-")
	for i, w := range words {
		if w != "" {
			words[i] = strings.ToUpper(w[:1]) + w[1:]
		}
	}
	return strings.Join(words, " ")
}

func fontStack(name, fallback string) string {
	if name == "" {
		return ""
	}
	return strconv.Quote(name) + ", " + fallback
}

// px reads "18px" (or a bare number) as a number of pixels.
func px(s string) (float64, bool) {
	v, err := strconv.ParseFloat(strings.TrimSuffix(strings.TrimSpace(s), "px"), 64)
	return v, err == nil
}
