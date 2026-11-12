package sections

import (
	"strings"
	"testing"
)

const testSchema = `{
  "$schema": "https://ui.chrisgarlick.com/schema/section/1.json",
  "name": "t", "title": "T", "version": 1,
  "variants": { "default": "Default", "wide": "Wide" },
  "fields": {
    "title": { "type": "rich-text", "required": true, "max": 10 },
    "url": { "type": "url" },
    "img": { "type": "image" },
    "items": { "type": "list", "max": 2, "item": {
      "label": { "type": "text", "required": true },
      "style": { "type": "enum", "options": ["a", "b"], "default": "b" }
    }}
  }
}`

func TestSchemaOrderAndFill(t *testing.T) {
	s, err := ParseSchema([]byte(testSchema))
	if err != nil {
		t.Fatal(err)
	}
	var names []string
	for _, f := range s.Fields {
		names = append(names, f.Name)
	}
	if strings.Join(names, ",") != "title,url,img,items" || s.Variants[0].Name != "default" {
		t.Fatalf("order lost: %v %v", names, s.Variants)
	}
	got := s.Fill(map[string]any{"items": []any{map[string]any{"label": "x"}}})
	item := got["items"].([]any)[0].(map[string]any)
	if got["title"] != "" || got["url"] != "" || got["img"] != nil || item["style"] != "b" {
		t.Fatalf("fill: %#v", got)
	}
}

func TestSchemaValidate(t *testing.T) {
	s, err := ParseSchema([]byte(testSchema))
	if err != nil {
		t.Fatal(err)
	}
	err = s.Validate(map[string]any{
		"titel": "typo",
		"url":   "javascript:alert(1)",
		"img":   map[string]any{"src": "/a.jpg"},
		"items": []any{map[string]any{"style": "c"}, map[string]any{"label": "b"}, map[string]any{"label": "c"}},
	})
	for _, want := range []string{"titel: not a field", "title: required", "url: \"javascript", "img.alt: required", "items: 3 items, at most 2"} {
		if err == nil || !strings.Contains(err.Error(), want) {
			t.Errorf("want %q in %v", want, err)
		}
	}
	if err := s.Validate(map[string]any{"title": "Hi *there*", "items": []any{map[string]any{"label": "x", "style": "a"}}}); err != nil {
		t.Errorf("valid content: %v", err)
	}
}

func TestSchemaRejects(t *testing.T) {
	bad := map[string]string{
		strings.Replace(testSchema, `"type": "url"`, `"type": "link"`, 1):                      `type "link"`,
		strings.Replace(testSchema, `"default": "b"`, `"default": "z"`, 1):                     "default",
		strings.Replace(testSchema, `"version": 1`, `"version": 1, "extra": 1`, 1):             "unknown field",
		strings.Replace(testSchema, `"url": { "type": "url" }`, `"Url": { "type": "url" }`, 1): "lower-case",
		strings.Replace(testSchema, `"options": ["a", "b"], `, ``, 1):                          "enum fields need them",
	}
	for src, want := range bad {
		if _, err := ParseSchema([]byte(src)); err == nil || !strings.Contains(err.Error(), want) {
			t.Errorf("got %v, want an error about %q", err, want)
		}
	}
}

func TestCheck(t *testing.T) {
	s, err := ParseSchema([]byte(testSchema))
	if err != nil {
		t.Fatal(err)
	}
	tpl, err := Parse("t", props+`{{ kit_rich($content['title']) }} {{ $content['titel'] }}
@if($variant === 'narrow') x @endif
@foreach($content['items'] as $it){{ $it['label'] }}{{ $it['lable'] }}@endforeach
@foreach($content['url'] as $x) @endforeach`)
	if err != nil {
		t.Fatal(err)
	}
	err = Check(tpl, s)
	for _, want := range []string{"$content['titel'] isn't a field", `"narrow" isn't one of`, "$it['lable'] isn't a field", "a url field, not a list", "field img isn't used", "field items[].style isn't used"} {
		if err == nil || !strings.Contains(err.Error(), want) {
			t.Errorf("want %q in %v", want, err)
		}
	}
}

// Every bound field in kit's sections names a site setting of the same shape.
func TestSectionBindsMatchTheSiteSettings(t *testing.T) {
	secs, err := Load("../../sections")
	if err != nil {
		t.Fatal(err)
	}
	site, err := LoadSettings("../../settings/site.schema.json")
	if err != nil {
		t.Fatal(err)
	}
	if err := CheckBinds(secs, site); err != nil {
		t.Fatal(err)
	}
	// And a bad bind is caught.
	secs[0].Schema.Fields[0].Bind = "site.nope"
	if err := CheckBinds(secs[:1], site); err == nil || !strings.Contains(err.Error(), "isn't a site setting") {
		t.Fatalf("got %v", err)
	}
}
