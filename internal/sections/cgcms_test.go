package sections

import (
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"strings"
	"testing"
)

// The field mapping, on a schema with one field of every kind.
func TestCgCmsFieldMapping(t *testing.T) {
	s, err := ParseSchema([]byte(`{
  "$schema": "https://ui.chrisgarlick.com/schema/section/1.json",
  "name": "demo", "title": "Demo's", "version": 1,
  "variants": { "default": "Split", "centred": "Centred" },
  "fields": {
    "title": { "type": "rich-text", "label": "Heading", "required": true, "max": 80 },
    "lede": { "type": "rich-text", "help": "*Stars* are italics." },
    "eyebrow": { "type": "text", "max": 60, "default": "Hello" },
    "body": { "type": "textarea" },
    "count": { "type": "number", "min": 1, "max": 9, "default": 3 },
    "boxed": { "type": "boolean", "default": true },
    "plain": { "type": "boolean", "default": false },
    "tone": { "type": "enum", "options": ["plain", "dark"] },
    "url": { "type": "url" },
    "photo": { "type": "image", "sizes": "hero" },
    "logo": { "type": "image", "alt": "optional" },
    "level": { "type": "heading-level", "default": 1 },
    "icon": { "type": "icon" },
    "phone": { "type": "text", "label": "Phone", "required": true, "bind": "site.phone" },
    "prices": { "type": "list", "min": 1, "max": 3, "item": {
      "featured": { "type": "boolean" },
      "name": { "type": "text", "required": true },
      "features": { "type": "list", "max": 8, "item": { "text": { "type": "text" } } }
    }}
  }
}`))
	if err != nil {
		t.Fatal(err)
	}
	site, _ := ParseSchema([]byte(`{"$schema": "https://ui.chrisgarlick.com/schema/section/1.json", "name": "site", "title": "Site", "version": 1,
  "fields": { "phone": { "type": "text", "label": "Phone number" } }}`))
	php := (&Section{Name: "demo", Schema: s}).CgCmsBlock(site)
	for _, want := range []string{
		`Block::make('kit-demo', 'Demo\'s')->fields([`,
		`Field::select('variant')->label('Layout')->options(['default', 'centred'])->default('default')->help('default: Split. centred: Centred.'),`,
		`Field::textarea('title')->label('Heading')->required()->maxLength(80)->help('*Stars* for italics, **double stars** for bold.'),`,
		`Field::textarea('lede')->help('*Stars* are italics.'),`,
		`Field::text('eyebrow')->maxLength(60)->default('Hello'),`,
		`Field::textarea('body'),`,
		`Field::number('count')->min(1)->max(9)->default(3)->help('From 1 to 9.'),`,
		`Field::boolean('boxed')->default(true),`,
		`Field::boolean('plain'),`,
		`Field::select('tone')->options(['plain', 'dark'])->default('plain'),`,
		`Field::url('url'),`,
		`Field::media('photo')->requireAlt()->preset('hero'),`,
		`Field::media('logo'),`,
		`Field::select('level')->options(['1', '2', '3', '4'])->default('1'),`,
		`Field::select('icon')->options(['', 'app-window', 'bag',`,
		`Field::text('phone')->label('Phone')->help('Left empty, it shows the site\'s phone number.'),`,
		`Field::repeater('prices')->min(1)->max(3)->rowLabel('name')->fields([`,
		`            Field::repeater('features')->max(8)->rowLabel('text')->fields([`,
		`                Field::text('text'),`,
		`])->view('kit-blocks::demo'),`,
	} {
		if !strings.Contains(php, want) {
			t.Errorf("missing %s\n%s", want, php)
		}
	}
	if strings.Contains(php, "richText") {
		t.Error("rich text maps to cg-cms's richText")
	}
	// No variant select for one layout.
	s.Variants = s.Variants[:1]
	if php := (&Section{Name: "demo", Schema: s}).CgCmsBlock(nil); strings.Contains(php, "'variant'") || !strings.Contains(php, `Left empty, it shows the site\'s details.`) {
		t.Errorf("one layout, no site schema:\n%s", php)
	}
}

// The header's links leave out "This page" and "This section": cg-cms works them out.
func TestCgCmsWorkedOut(t *testing.T) {
	secs, err := Load("../../sections")
	if err != nil {
		t.Fatal(err)
	}
	for _, s := range secs {
		if s.Name != "header" {
			continue
		}
		php := s.CgCmsBlock(nil)
		if strings.Contains(php, "Field::boolean('current')") || strings.Contains(php, "Field::boolean('section')") || !strings.Contains(php, "Field::repeater('links')") {
			t.Errorf("the header's links:\n%s", php)
		}
		// The schema itself keeps it, for WordPress and kit's own checks.
		links := s.Schema.Fields[slices.IndexFunc(s.Schema.Fields, func(f *Field) bool { return f.Name == "links" })]
		if !slices.ContainsFunc(links.Item, func(f *Field) bool { return f.Name == "current" }) || !slices.ContainsFunc(links.Item, func(f *Field) bool { return f.Name == "section" }) {
			t.Error("CgCmsFields changed the schema")
		}
		return
	}
	t.Fatal("no header section")
}

// Every section, generated for cg-cms, loads as blocks against stand-ins for
// cg-cms's classes, and every demo, stored as cg-cms stores it, renders
// kit's HTML through kit_cgcms_block().
func TestCgCmsBlocks(t *testing.T) {
	php, err := exec.LookPath("php")
	if err != nil {
		t.Skip("php isn't installed")
	}
	secs, err := Load("../../sections")
	if err != nil {
		t.Fatal(err)
	}
	site, err := LoadSettings("../../settings/site.schema.json")
	if err != nil {
		t.Fatal(err)
	}
	out := t.TempDir()
	var blocks []string
	var fixtures []CgCmsFixture
	for _, s := range secs {
		b, err := s.CgCms(out, site)
		if err != nil {
			t.Fatal(s.Name, err)
		}
		blocks = append(blocks, b)
		f, err := s.CgCmsFixtures()
		if err != nil {
			t.Fatal(err)
		}
		fixtures = append(fixtures, f...)
	}
	siteJSON, _ := os.ReadFile("../../settings/site.schema.json")
	_ = os.MkdirAll(filepath.Join(out, "kit"), 0o755)
	for name, b := range map[string]string{"kit-blocks.php": CgCmsBlocksFile(blocks), "kit/kit.php": Runtime, "kit/cgcms.php": CgCmsRuntime, "kit/site.schema.json": string(siteJSON)} {
		if err := os.WriteFile(filepath.Join(out, name), []byte(b), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	fb, _ := json.Marshal(fixtures)
	ff := filepath.Join(t.TempDir(), "fixtures.json")
	if err := os.WriteFile(ff, fb, 0o600); err != nil {
		t.Fatal(err)
	}
	b, err := exec.Command(php, "testdata/cgcms.php", out, ff).CombinedOutput()
	if err != nil {
		t.Fatalf("php: %v\n%s", err, b)
	}
	type field struct {
		Type   string  `json:"type"`
		Name   string  `json:"name"`
		Fields []field `json:"fields"`
	}
	var res struct {
		Blocks []struct {
			Handle, Label, View string
			Fields              []field
		}
		Again int
		HTML  []string
	}
	if err := json.Unmarshal(b, &res); err != nil {
		t.Fatalf("php output: %v\n%s", err, b)
	}
	if len(res.Blocks) != len(secs) || res.Again != len(secs) {
		t.Fatalf("%d blocks (%d the second time) for %d sections", len(res.Blocks), res.Again, len(secs))
	}
	var walk func(where string, fs []*Field, got []field)
	walk = func(where string, fs []*Field, got []field) {
		if len(got) != len(fs) {
			t.Errorf("%s: %d fields, want %d", where, len(got), len(fs))
			return
		}
		for i, f := range fs {
			if got[i].Name != f.Name || got[i].Type != cgcmsTypes[f.Type] {
				t.Errorf("%s: %s is a %s, want %s", where, f.Name, got[i].Type, cgcmsTypes[f.Type])
			}
			if got[i].Type == "richText" {
				t.Errorf("%s: %s is richText", where, f.Name)
			}
			if f.Type == "list" {
				walk(where+"."+f.Name, f.Item, got[i].Fields)
			}
		}
	}
	for i, s := range secs {
		bl := res.Blocks[i]
		if bl.Handle != "kit-"+s.Name || bl.Label != s.Schema.Title || bl.View != "kit-blocks::"+s.Name {
			t.Errorf("%s: block %s %q %s", s.Name, bl.Handle, bl.Label, bl.View)
		}
		got := bl.Fields
		if len(s.Schema.Variants) > 1 {
			if len(got) == 0 || got[0].Name != "variant" || got[0].Type != "select" {
				t.Errorf("%s: no variant select first", s.Name)
				continue
			}
			got = got[1:]
		}
		walk(s.Name, s.CgCmsFields(), got)
		view, err := os.ReadFile(filepath.Join(out, "views", s.Name+".blade.php"))
		if err != nil || !strings.Contains(string(view), "{{ kit_cgcms_block('"+s.Name+"', $data) }}") {
			t.Errorf("%s: the view doesn't render the block", s.Name)
		}
	}
	if len(res.HTML) != len(fixtures) {
		t.Fatalf("%d renders for %d fixtures", len(res.HTML), len(fixtures))
	}
	for i, f := range fixtures {
		if res.HTML[i] != f.HTML {
			t.Errorf("%s: %s: cg-cms and kit differ\n--- kit\n%s\n--- cg-cms\n%s", f.Section, f.Title, f.HTML, res.HTML[i])
		}
	}

	// Inside a cg-cms app: the site's details from its settings, the page tagged.
	t.Run("settings", func(t *testing.T) {
		b, err := exec.Command(php, "testdata/cgcms-settings.php", out).CombinedOutput()
		if err != nil {
			t.Fatalf("php: %v\n%s", err, b)
		}
		var got struct {
			StatsTags []string          `json:"stats_tags"`
			Tags      []string          `json:"tags"`
			CTA       string            `json:"cta"`
			Site      map[string]string `json:"site"`
		}
		if err := json.Unmarshal(b, &got); err != nil {
			t.Fatalf("php output: %v\n%s", err, b)
		}
		if len(got.StatsTags) != 0 || !slices.Equal(got.Tags, []string{"settings:site"}) {
			t.Errorf("tags: %v after stats (no bound fields), %v after the call to action", got.StatsTags, got.Tags)
		}
		if !strings.Contains(got.CTA, "01234 999999") {
			t.Errorf("the call to action doesn't show the settings' phone number:\n%s", got.CTA)
		}
		// Settings win; a detail empty there shows config's.
		if got.Site["name"] != "Settings Ltd" || got.Site["phone"] != "01234 999999" || got.Site["email"] != "hello@config.test" {
			t.Errorf("site: %v", got.Site)
		}
	})

	// The header's current page and section, from the request's path.
	t.Run("current", func(t *testing.T) {
		b, err := exec.Command(php, "testdata/cgcms-current.php", out, "services", "services/laravel", "services/laravel/hosting", "work", "", "services-extra/more").CombinedOutput()
		if err != nil {
			t.Fatalf("php: %v\n%s", err, b)
		}
		var got map[string]map[string]string
		if err := json.Unmarshal(b, &got); err != nil {
			t.Fatalf("php output: %v\n%s", err, b)
		}
		// On every path the stored marks are honoured and another site's link is never marked.
		always := map[string]string{"Marked": "true", "Stored": "page", "Elsewhere": ""}
		for path, want := range map[string]map[string]string{
			"services":                 {"Home": "", "Services": "page", "Laravel": "", "Services extra": ""},
			"services/laravel":         {"Home": "", "Services": "true", "Laravel": "page", "Services extra": ""},
			"services/laravel/hosting": {"Home": "", "Services": "true", "Laravel": "true", "Services extra": ""},
			"work":                     {"Home": "", "Services": "", "Laravel": "", "Services extra": ""},
			"":                         {"Home": "page", "Services": "", "Laravel": "", "Services extra": ""},
			"services-extra/more":      {"Home": "", "Services": "", "Laravel": "", "Services extra": "true"},
		} {
			for label, mark := range always {
				want[label] = mark
			}
			for label, mark := range want {
				if got[path][label] != mark {
					t.Errorf("/%s: %s is %q, want %q", path, label, got[path][label], mark)
				}
			}
		}
	})

	// The views, with real Blade.
	t.Run("blade", func(t *testing.T) {
		blade, _ := filepath.Abs("../../tests/blade")
		if _, err := os.Stat(filepath.Join(blade, "vendor")); err != nil {
			t.Skip("Blade isn't installed: composer install in tests/blade")
		}
		b, err := exec.Command(php, "testdata/cgcms-blade.php", blade, out, ff).CombinedOutput()
		if err != nil {
			t.Fatalf("php: %v\n%s", err, b)
		}
		var html []string
		if err := json.Unmarshal(b, &html); err != nil || len(html) != len(fixtures)+1 {
			t.Fatalf("blade output: %v\n%s", err, b)
		}
		for i, f := range fixtures {
			if html[i] != f.HTML {
				t.Errorf("%s: %s: the Blade view and kit differ\n--- kit\n%q\n--- view\n%q", f.Section, f.Title, f.HTML, html[i])
			}
		}
		// Each section's CSS is pushed once, however many of its blocks a page has.
		stack := html[len(fixtures)]
		if n := strings.Count(stack, `href="/kit-blocks/sections/hero/style.css"`); n != 1 {
			t.Errorf("the hero's CSS is pushed %d times:\n%s", n, stack)
		}
	})
}
