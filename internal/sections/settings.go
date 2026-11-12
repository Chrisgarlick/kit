package sections

import (
	"errors"
	"fmt"
	"os"
	"slices"
	"strings"
)

// The site's details (settings/site.schema.json): the business name, phone,
// email, socials and the rest, entered once in a CMS. A section's field with
// "bind": "site.<name>" shows the site's value when the block leaves the
// field empty, so a phone number changes everywhere at once.

// LoadSettings reads the site settings schema.
func LoadSettings(path string) (*Schema, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	s, err := ParseSchema(b)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", path, err)
	}
	return s, nil
}

// CheckBinds checks that every bound field names a setting of the same shape:
// the same type, the same options for an enum, the same item fields for a list.
func CheckBinds(secs []*Section, site *Schema) error {
	var errs []error
	for _, s := range secs {
		for _, f := range s.Schema.Fields {
			if f.Bind == "" {
				continue
			}
			name, ok := strings.CutPrefix(f.Bind, "site.")
			i := slices.IndexFunc(site.Fields, func(sf *Field) bool { return sf.Name == name })
			if !ok || i < 0 {
				errs = append(errs, fmt.Errorf("sections/%s: %s binds to %q, which isn't a site setting", s.Name, f.Name, f.Bind))
				continue
			}
			if why := sameShape(f, site.Fields[i]); why != "" {
				errs = append(errs, fmt.Errorf("sections/%s: %s binds to %s, but %s", s.Name, f.Name, f.Bind, why))
			}
		}
	}
	return errors.Join(errs...)
}

func sameShape(a, b *Field) string {
	if a.Type != b.Type {
		return fmt.Sprintf("one is %s and the other %s", a.Type, b.Type)
	}
	if a.Type == "enum" && !slices.Equal(a.Options, b.Options) {
		return "their options differ"
	}
	if a.Type == "list" {
		if len(a.Item) != len(b.Item) {
			return "their items have different fields"
		}
		for i := range a.Item {
			if a.Item[i].Name != b.Item[i].Name {
				return "their items have different fields"
			}
			if why := sameShape(a.Item[i], b.Item[i]); why != "" {
				return "in their items, " + why
			}
		}
	}
	return ""
}
