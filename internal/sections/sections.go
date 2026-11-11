// Package sections builds kit's website sections: the header, hero, footer
// and the rest that client sites (cg-cms, WordPress) are assembled from. A
// section is a folder, sections/<name>/, holding
//
//	<name>.blade.php    the template, in kit's Blade subset (template.go)
//	<name>.schema.json  its content fields (schema.go)
//	<name>.css          its styles, on --kit-* tokens
//	demo.json           example content for the docs site and the tests
//	README.md           its documentation and front matter, as a component's
//
// and kit renders it in Go (for the docs site and the checks), exports the
// Blade file for projects with Blade, and compiles it to plain PHP for those
// without.
package sections

import (
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

//go:embed runtime/kit.php
var runtimeSource string

//go:embed runtime/icons.json
var iconsJSON []byte

// Icons are the icons kit_icon() draws, by name: each one's SVG content, on a
// 24px grid, drawn with currentColor strokes (Lucide's shapes).
var Icons = func() map[string]string {
	var m map[string]string
	if err := json.Unmarshal(iconsJSON, &m); err != nil {
		panic("runtime/icons.json: " + err.Error())
	}
	return m
}()

// IconNames is the icon set's names, sorted: an icon field's options.
var IconNames = func() []string {
	names := make([]string, 0, len(Icons))
	for n := range Icons {
		names = append(names, n)
	}
	sort.Strings(names)
	return names
}()

// Runtime is kit.php, the helpers compiled templates call, with the icon set
// written into kit_icon().
var Runtime = func() string {
	var b strings.Builder
	b.WriteString("[")
	for i, n := range IconNames {
		if i > 0 {
			b.WriteString(", ")
		}
		b.WriteString(phpString(n) + " => " + phpString(Icons[n]))
	}
	b.WriteString("]")
	const mark = "/* KIT_ICONS */ []"
	if !strings.Contains(runtimeSource, mark) {
		panic("runtime/kit.php: no " + mark)
	}
	return strings.Replace(runtimeSource, mark, b.String(), 1)
}()

// Section is one folder under sections/.
type Section struct {
	Name     string
	Dir      string
	Source   string // the template's source, as written
	Template *Template
	Schema   *Schema
	Demos    []Demo
}

// Demo is one example in demo.json: content for a variant, shown on the docs
// site and rendered by the tests.
type Demo struct {
	Title   string         `json:"title"`
	Variant string         `json:"variant"`
	Width   string         `json:"width"` // the frame the demo is shown in: "" (full) or "mobile"
	Content map[string]any `json:"content"`
}

// Load reads every section under dir (the repository's sections/ folder) and
// checks each: the template parses, the schema is valid, they agree, and every
// demo's content validates and renders. Every problem is reported.
func Load(dir string) ([]*Section, error) {
	entries, err := os.ReadDir(dir)
	if errors.Is(err, os.ErrNotExist) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var out []*Section
	var errs []error
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		s, err := LoadOne(filepath.Join(dir, e.Name()))
		if err != nil {
			errs = append(errs, err)
			continue
		}
		out = append(out, s)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out, errors.Join(errs...)
}

// LoadOne reads and checks one section folder.
func LoadOne(dir string) (*Section, error) {
	name := filepath.Base(dir)
	where := "sections/" + name
	if !slugRe.MatchString(name) {
		return nil, fmt.Errorf("%s: folder names are lower-case letters, digits and dashes", where)
	}
	s := &Section{Name: name, Dir: dir}
	src, err := os.ReadFile(filepath.Join(dir, name+".blade.php"))
	if err != nil {
		return nil, fmt.Errorf("%s: %w", where, err)
	}
	s.Source = string(src)
	if s.Template, err = Parse(where+"/"+name+".blade.php", s.Source); err != nil {
		return nil, err
	}
	sb, err := os.ReadFile(filepath.Join(dir, name+".schema.json"))
	if err != nil {
		return nil, fmt.Errorf("%s: %w", where, err)
	}
	if s.Schema, err = ParseSchema(sb); err != nil {
		return nil, fmt.Errorf("%s/%s.schema.json: %w", where, name, err)
	}
	if s.Schema.Name != name {
		return nil, fmt.Errorf("%s/%s.schema.json: name is %q, the folder's", where, name, name)
	}
	var errs []error
	if err := Check(s.Template, s.Schema); err != nil {
		errs = append(errs, err)
	}
	db, err := os.ReadFile(filepath.Join(dir, "demo.json"))
	if err != nil {
		return nil, fmt.Errorf("%s: %w", where, err)
	}
	if err := json.Unmarshal(db, &s.Demos); err != nil {
		return nil, fmt.Errorf("%s/demo.json: %w", where, err)
	}
	if len(s.Demos) == 0 {
		errs = append(errs, fmt.Errorf("%s/demo.json: needs at least one demo", where))
	}
	for i, d := range s.Demos {
		if d.Title == "" {
			errs = append(errs, fmt.Errorf("%s/demo.json[%d]: needs a title", where, i))
		}
		if d.Width != "" && d.Width != "mobile" {
			errs = append(errs, fmt.Errorf("%s/demo.json[%d]: width is \"\" or \"mobile\"", where, i))
		}
		if _, err := s.Render(d.Content, d.Variant); err != nil {
			errs = append(errs, fmt.Errorf("%s/demo.json[%d] (%s): %w", where, i, d.Title, err))
		}
	}
	return s, errors.Join(errs...)
}

// Render validates the content, fills in its defaults and renders the
// section in the variant ("" for the default).
func (s *Section) Render(content map[string]any, variant string) (string, error) {
	if variant == "" {
		variant = s.Schema.Variants[0].Name
	}
	if !s.Schema.HasVariant(variant) {
		return "", fmt.Errorf("%q isn't a variant of %s", variant, s.Name)
	}
	if err := s.Schema.Validate(content); err != nil {
		return "", err
	}
	return s.Template.Render(map[string]any{"content": s.Schema.Fill(content), "variant": variant})
}

// Targets are what `kit section export` writes for a project.
var Targets = []string{"blade", "php"}

// Export writes the section into out for a project: the template as Blade
// (target "blade") or compiled to PHP with kit.php beside it ("php"), plus its
// CSS, its schema and its demo content, filled.
func (s *Section) Export(target, out string) ([]string, error) {
	files := map[string]string{}
	switch target {
	case "blade":
		files[s.Name+".blade.php"] = s.Source
		files["kit.php"] = Runtime // kit_url, kit_rich: Blade templates call them too
	case "php":
		files[s.Name+".php"] = s.Template.PHP("sections/" + s.Name + "/" + s.Name + ".blade.php")
		files["kit.php"] = Runtime
	default:
		return nil, fmt.Errorf("target is one of %s", strings.Join(Targets, ", "))
	}
	// The demos with every field filled, ready to render: content passed to a
	// section must have every field (the CMS fills it from the schema).
	var demos []Demo
	for _, d := range s.Demos {
		d.Content = s.Schema.Fill(d.Content)
		if d.Variant == "" {
			d.Variant = s.Schema.Variants[0].Name
		}
		demos = append(demos, d)
	}
	db, err := json.MarshalIndent(demos, "", "  ")
	if err != nil {
		return nil, err
	}
	files[s.Name+".demo.json"] = string(db) + "\n"
	for _, f := range []string{s.Name + ".css", s.Name + ".schema.json"} {
		b, err := os.ReadFile(filepath.Join(s.Dir, f))
		if err != nil {
			return nil, err
		}
		files[f] = string(b)
	}
	if err := os.MkdirAll(out, 0o755); err != nil {
		return nil, err
	}
	var written []string
	for name, body := range files {
		p := filepath.Join(out, name)
		if err := os.WriteFile(p, []byte(body), 0o644); err != nil { //nolint:gosec // project source files
			return nil, err
		}
		written = append(written, p)
	}
	sort.Strings(written)
	return written, nil
}
