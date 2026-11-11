package sections

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"regexp"
	"slices"
	"strings"
	"unicode/utf8"
)

// A schema (sections/<name>/<name>.schema.json) describes a section's
// content: the fields the owner edits in the CMS. It's the one description
// both CMSs build their editors from (WordPress blocks, cg-cms blocks), and
// what kit fills, checks and renders demo content against. The format is
// specified in plans/wordpress.md and published as schema/section-1.json.

// SchemaURL is the $schema a section schema declares.
const SchemaURL = "https://ui.chrisgarlick.com/schema/section/1.json"

// Schema is one section's content description.
type Schema struct {
	Name        string
	Title       string
	Version     int
	Category    string
	Description string
	Variants    []Variant // the first is the default
	Fields      []*Field  // in the order the editor shows them
}

// Variant is one of a section's layouts (hero: split or centred).
type Variant struct {
	Name, Label string
}

// Field is one editable value.
type Field struct {
	Name     string
	Type     string
	Label    string
	Help     string
	Required bool
	Min, Max int      // characters for text, items for a list, the range for a number
	Options  []string // enum
	Default  any
	Alt      string   // image: "required" (the default) or "optional" (may be decorative)
	Sizes    string   // image: the named size set (hero, card…)
	Bind     string   // a site setting the field shows unless overridden
	Item     []*Field // list: each item's fields
}

// The field types. Phase 1 has these; link, icon, colour and reference come
// with the sections that need them.
var fieldTypes = []string{"text", "textarea", "rich-text", "number", "boolean", "enum", "url", "image", "heading-level", "list"}

var nameRe = regexp.MustCompile(`^[a-z][a-z0-9_]*$`)

// ParseSchema reads a schema, keeping the fields in file order, and checks it.
func ParseSchema(b []byte) (*Schema, error) {
	var raw struct {
		Schema      string          `json:"$schema"`
		Name        string          `json:"name"`
		Title       string          `json:"title"`
		Version     int             `json:"version"`
		Category    string          `json:"category"`
		Description string          `json:"description"`
		Variants    json.RawMessage `json:"variants"`
		Fields      json.RawMessage `json:"fields"`
	}
	dec := json.NewDecoder(bytes.NewReader(b))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&raw); err != nil {
		return nil, err
	}
	s := &Schema{Name: raw.Name, Title: raw.Title, Version: raw.Version, Category: raw.Category, Description: raw.Description}
	var errs []error
	if raw.Schema != SchemaURL {
		errs = append(errs, fmt.Errorf("$schema is %s", SchemaURL))
	}
	if !slugRe.MatchString(s.Name) || s.Title == "" || s.Version < 1 {
		errs = append(errs, fmt.Errorf("name (lower-case), title and version (from 1) are required"))
	}
	if len(raw.Variants) > 0 {
		var err error
		s.Variants, err = parseVariants(raw.Variants)
		if err != nil {
			errs = append(errs, fmt.Errorf("variants: %w", err))
		}
	}
	if len(s.Variants) == 0 {
		s.Variants = []Variant{{"default", "Default"}}
	}
	fields, err := parseFields(raw.Fields, "")
	if err != nil {
		errs = append(errs, err)
	}
	s.Fields = fields
	return s, errors.Join(errs...)
}

var slugRe = regexp.MustCompile(`^[a-z][a-z0-9-]*$`)

func parseVariants(b json.RawMessage) ([]Variant, error) {
	var out []Variant
	err := objectEntries(b, func(name string, v json.RawMessage) error {
		var label string
		if err := json.Unmarshal(v, &label); err != nil || label == "" {
			return fmt.Errorf("%s: a variant's value is its label", name)
		}
		if !slugRe.MatchString(name) {
			return fmt.Errorf("%q: variant names are lower-case", name)
		}
		out = append(out, Variant{name, label})
		return nil
	})
	return out, err
}

// objectEntries calls fn for each key of a JSON object, in order.
func objectEntries(b json.RawMessage, fn func(string, json.RawMessage) error) error {
	dec := json.NewDecoder(bytes.NewReader(b))
	t, err := dec.Token()
	if err != nil {
		return err
	}
	if d, ok := t.(json.Delim); !ok || d != '{' {
		return fmt.Errorf("expected an object")
	}
	seen := map[string]bool{}
	for dec.More() {
		t, err := dec.Token()
		if err != nil {
			return err
		}
		key := t.(string)
		if seen[key] {
			return fmt.Errorf("%q appears twice", key)
		}
		seen[key] = true
		var v json.RawMessage
		if err := dec.Decode(&v); err != nil {
			return err
		}
		if err := fn(key, v); err != nil {
			return err
		}
	}
	if _, err := dec.Token(); err != nil && err != io.EOF {
		return err
	}
	return nil
}

func parseFields(b json.RawMessage, where string) ([]*Field, error) {
	if len(b) == 0 {
		return nil, fmt.Errorf("%sfields: required", where)
	}
	var out []*Field
	var errs []error
	err := objectEntries(b, func(name string, v json.RawMessage) error {
		f, err := parseField(name, v, where+name)
		if err != nil {
			errs = append(errs, err)
			return nil
		}
		out = append(out, f)
		return nil
	})
	if err != nil {
		errs = append(errs, fmt.Errorf("%sfields: %w", where, err))
	}
	return out, errors.Join(errs...)
}

func parseField(name string, b json.RawMessage, where string) (*Field, error) {
	var raw struct {
		Type     string          `json:"type"`
		Label    string          `json:"label"`
		Help     string          `json:"help"`
		Required bool            `json:"required"`
		Min      int             `json:"min"`
		Max      int             `json:"max"`
		Options  []string        `json:"options"`
		Default  any             `json:"default"`
		Alt      string          `json:"alt"`
		Sizes    string          `json:"sizes"`
		Bind     string          `json:"bind"`
		Item     json.RawMessage `json:"item"`
	}
	dec := json.NewDecoder(bytes.NewReader(b))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&raw); err != nil {
		return nil, fmt.Errorf("%s: %w", where, err)
	}
	f := &Field{Name: name, Type: raw.Type, Label: raw.Label, Help: raw.Help, Required: raw.Required,
		Min: raw.Min, Max: raw.Max, Options: raw.Options, Default: raw.Default, Alt: raw.Alt, Sizes: raw.Sizes, Bind: raw.Bind}
	var problems []string
	if !nameRe.MatchString(name) {
		problems = append(problems, "field names are lower-case letters, digits and underscores")
	}
	if !slices.Contains(fieldTypes, f.Type) {
		problems = append(problems, fmt.Sprintf("type %q isn't one of %s", f.Type, strings.Join(fieldTypes, ", ")))
	}
	if f.Min < 0 || f.Max < 0 || f.Max > 0 && f.Min > f.Max {
		problems = append(problems, "min and max are counts, min no more than max")
	}
	if (len(f.Options) > 0) != (f.Type == "enum") {
		problems = append(problems, "options are for enum fields, and enum fields need them")
	}
	if f.Alt != "" && (f.Type != "image" || f.Alt != "required" && f.Alt != "optional") {
		problems = append(problems, `alt is "required" or "optional", on image fields`)
	}
	if f.Type == "image" && f.Alt == "" {
		f.Alt = "required"
	}
	if (len(raw.Item) > 0) != (f.Type == "list") {
		problems = append(problems, "item is for list fields, and list fields need it")
	}
	if f.Type == "list" && len(raw.Item) > 0 {
		item, err := parseFields(raw.Item, where+".")
		if err != nil {
			return nil, err
		}
		f.Item = item
	}
	if f.Default != nil {
		if errs := f.validate(f.Default, where+": default"); len(errs) > 0 {
			problems = append(problems, errors.Join(errs...).Error())
		}
	}
	if len(problems) > 0 {
		return nil, fmt.Errorf("%s: %s", where, strings.Join(problems, "; "))
	}
	return f, nil
}

// zero is a field's value when the content leaves it out: its default, or
// the empty value of its type.
func (f *Field) zero() any {
	if f.Default != nil {
		return f.Default
	}
	switch f.Type {
	case "text", "textarea", "rich-text", "url":
		return ""
	case "boolean":
		return false
	case "enum":
		return f.Options[0]
	case "heading-level":
		return float64(2)
	case "list":
		return []any{}
	}
	return nil // number, image
}

// Fill returns the content with every field present, missing ones at their
// defaults, so a template can read any field without isset. It doesn't
// change the content it's given.
func (s *Schema) Fill(content map[string]any) map[string]any {
	return fillFields(s.Fields, content)
}

func fillFields(fields []*Field, content map[string]any) map[string]any {
	out := map[string]any{}
	for _, f := range fields {
		v, ok := content[f.Name]
		if !ok || v == nil {
			out[f.Name] = f.zero()
			continue
		}
		if list, isList := v.([]any); f.Type == "list" && isList {
			items := make([]any, len(list))
			for i, it := range list {
				if m, ok := it.(map[string]any); ok {
					items[i] = fillFields(f.Item, m)
				} else {
					items[i] = it
				}
			}
			v = items
		}
		out[f.Name] = v
	}
	return out
}

// Validate checks content against the schema: unknown fields, missing
// required ones, wrong types, lengths, options and URLs. Every problem is
// reported.
func (s *Schema) Validate(content map[string]any) error {
	return errors.Join(validateFields(s.Fields, content, "")...)
}

func validateFields(fields []*Field, content map[string]any, where string) []error {
	var errs []error
	for k := range content {
		if !slices.ContainsFunc(fields, func(f *Field) bool { return f.Name == k }) {
			errs = append(errs, fmt.Errorf("%s%s: not a field of this section", where, k))
		}
	}
	for _, f := range fields {
		v, ok := content[f.Name]
		if !ok || v == nil || v == "" {
			if f.Required {
				errs = append(errs, fmt.Errorf("%s%s: required", where, f.Name))
			}
			continue
		}
		errs = append(errs, f.validate(v, where+f.Name)...)
	}
	return errs
}

func (f *Field) validate(v any, where string) []error {
	bad := func(format string, args ...any) []error {
		return []error{fmt.Errorf("%s: "+format, append([]any{where}, args...)...)}
	}
	switch f.Type {
	case "text", "textarea", "rich-text", "url":
		s, ok := v.(string)
		if !ok {
			return bad("a string")
		}
		if f.Type == "text" && strings.ContainsAny(s, "\n\r") {
			return bad("one line")
		}
		n := utf8.RuneCountInString(s)
		if f.Max > 0 && n > f.Max {
			return bad("%d characters, at most %d", n, f.Max)
		}
		if f.Min > 0 && n < f.Min {
			return bad("%d characters, at least %d", n, f.Min)
		}
		if f.Type == "url" {
			if u, _ := safeURL(s); u == "#" && s != "#" {
				return bad("%q isn't an address kit links to (http, https, mailto, tel, or one on the site)", s)
			}
		}
	case "number":
		n, ok := v.(float64)
		if !ok {
			return bad("a number")
		}
		if f.Max > 0 && (n < float64(f.Min) || n > float64(f.Max)) {
			return bad("between %d and %d", f.Min, f.Max)
		}
	case "boolean":
		if _, ok := v.(bool); !ok {
			return bad("true or false")
		}
	case "enum":
		s, ok := v.(string)
		if !ok || !slices.Contains(f.Options, s) {
			return bad("one of %s", strings.Join(f.Options, ", "))
		}
	case "heading-level":
		n, ok := v.(float64)
		if !ok || n != float64(int(n)) || n < 1 || n > 4 {
			return bad("a heading level, 1 to 4")
		}
	case "image":
		m, ok := v.(map[string]any)
		if !ok {
			return bad("an image: {src, alt, width, height}")
		}
		var errs []error
		for k, x := range m {
			switch k {
			case "src", "alt":
				if _, ok := x.(string); !ok {
					errs = append(errs, fmt.Errorf("%s.%s: a string", where, k))
				}
			case "width", "height":
				if n, ok := x.(float64); !ok || n <= 0 {
					errs = append(errs, fmt.Errorf("%s.%s: a size in pixels", where, k))
				}
			default:
				errs = append(errs, fmt.Errorf("%s.%s: images have src, alt, width and height", where, k))
			}
		}
		if src, _ := m["src"].(string); src == "" {
			errs = append(errs, fmt.Errorf("%s.src: required", where))
		} else if u, _ := safeURL(src); u == "#" {
			errs = append(errs, fmt.Errorf("%s.src: %q isn't an address kit loads", where, src))
		}
		if alt, ok := m["alt"].(string); f.Alt == "required" && (!ok || strings.TrimSpace(alt) == "") {
			errs = append(errs, fmt.Errorf("%s.alt: required (describe the image)", where))
		} else if !ok && f.Alt == "optional" {
			errs = append(errs, fmt.Errorf(`%s.alt: required: "" marks the image decorative`, where))
		}
		return errs
	case "list":
		list, ok := v.([]any)
		if !ok {
			return bad("a list")
		}
		if f.Max > 0 && len(list) > f.Max {
			return bad("%d items, at most %d", len(list), f.Max)
		}
		if len(list) < f.Min {
			return bad("%d items, at least %d", len(list), f.Min)
		}
		var errs []error
		for i, it := range list {
			m, ok := it.(map[string]any)
			if !ok {
				errs = append(errs, fmt.Errorf("%s[%d]: an object", where, i))
				continue
			}
			errs = append(errs, validateFields(f.Item, m, fmt.Sprintf("%s[%d].", where, i))...)
		}
		return errs
	}
	return nil
}

// HasVariant reports whether name is one of the section's variants.
func (s *Schema) HasVariant(name string) bool {
	return slices.ContainsFunc(s.Variants, func(v Variant) bool { return v.Name == name })
}
