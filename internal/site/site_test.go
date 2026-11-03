package site

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
)

// fixture writes a minimal kit tree into a temporary folder: two groups,
// shared data and tokens, the site's templates and assets copied from the
// real repo, plus the given component folders (name -> file -> contents).
func fixture(t *testing.T, components map[string]map[string]string) string {
	t.Helper()
	root := t.TempDir()
	write := func(rel, body string) {
		p := filepath.Join(root, rel)
		if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(p, []byte(body), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	write("site/groups.yaml", "- id: actions\n  title: Actions\n  summary: Things to press.\n  planned: [Button, Split button]\n- id: inputs\n  title: Inputs\n  summary: Things to fill in.\n")
	write("site/data/demo.yaml", "company: { name: Example }\n")
	write("tokens/tokens.css", ":root {\n  --kit-accent: #0f766e;\n  --kit-radius-1: 6px;\n  --kit-text-sm: 0.8rem;\n}\n")
	write("tokens/fonts.css", "/* none */\n")
	real := filepath.Join("..", "..")
	for _, dir := range []string{"site/templates", "site/assets"} {
		entries, err := os.ReadDir(filepath.Join(real, dir))
		if err != nil {
			t.Fatal(err)
		}
		for _, e := range entries {
			b, err := os.ReadFile(filepath.Join(real, dir, e.Name()))
			if err != nil {
				t.Fatal(err)
			}
			write(filepath.Join(dir, e.Name()), string(b))
		}
	}
	for name, files := range components {
		for f, body := range files {
			write(filepath.Join("components", name, f), body)
		}
	}
	return root
}

const goodReadme = "---\ntitle: Button\ngroup: actions\norder: 1\ntier: 1\nstatus: preview\nsummary: Press it.\n---\n\n## Usage\n\nUse `kit-button`.\n"

func TestBuildAssemblesGroupPagesFromFolders(t *testing.T) {
	root := fixture(t, map[string]map[string]string{
		"button": {
			"README.md":  goodReadme,
			"button.css": ".kit-button { color: var(--kit-accent); }\n",
			"demo.html":  `<button class="kit-button" type="button">Save {{.Data.company.name}}</button>`,
		},
	})
	s, err := Load(root)
	if err != nil {
		t.Fatal(err)
	}
	out := filepath.Join(t.TempDir(), "dist")
	res, err := s.Build(out, Options{BaseURL: "https://ui.example"})
	if err != nil {
		t.Fatal(err)
	}

	want := []string{"/", "/404.html", "/actions/", "/actions/button/", "/foundations/", "/inputs/"}
	if strings.Join(res.Pages, " ") != strings.Join(want, " ") {
		t.Fatalf("pages = %v, want %v", res.Pages, want)
	}
	read := func(rel string) string {
		b, err := os.ReadFile(filepath.Join(out, rel))
		if err != nil {
			t.Fatal(err)
		}
		return string(b)
	}

	group := read("actions/index.html")
	for _, s := range []string{
		`<a href="/actions/button/">Button</a>`, // the card links to the component page
		"Save Example",                          // the demo ran against the data in site/data
		"Split button",                          // still planned
	} {
		if !strings.Contains(group, s) {
			t.Errorf("actions page is missing %q", s)
		}
	}
	if strings.Contains(strings.SplitN(group, `id="planned-h"`, 2)[1], "<li>Button</li>") {
		t.Error("a shipped component is still listed as planned")
	}
	if inputs := read("inputs/index.html"); !strings.Contains(inputs, "Nothing here yet") {
		t.Error("an empty group should say so")
	}

	page := read("actions/button/index.html")
	if !strings.Contains(page, `<h2 id="usage">Usage</h2>`) || !strings.Contains(page, "<code>kit-button</code>") {
		t.Error("the README body wasn't rendered as Markdown")
	}
	if !strings.Contains(page, `<link rel="canonical" href="https://ui.example/actions/button/">`) {
		t.Error("canonical link is wrong")
	}

	// Strict CSP: no inline scripts, handlers or style attributes anywhere.
	inline := regexp.MustCompile(`<script(?:\s+type="module")?>|\son[a-z]+="|\sstyle="`)
	for _, p := range res.Pages {
		rel := strings.TrimPrefix(p, "/") + "index.html"
		if p == "/404.html" {
			rel = "404.html"
		}
		if m := inline.FindString(read(rel)); m != "" {
			t.Errorf("%s has inline code or style (%q), which the site's CSP blocks", p, m)
		}
	}

	// Bundles are hashed, compressed and include the component's CSS.
	css := res.Assets["kit.css"]
	if !regexp.MustCompile(`^/assets/kit-[A-Z0-9]+\.css$`).MatchString(css) {
		t.Errorf("kit.css asset = %q, want a hashed name", css)
	}
	if !strings.Contains(read(strings.TrimPrefix(css, "/")), ".kit-button") {
		t.Error("kit.css doesn't include the component's CSS")
	}
	if _, err := os.Stat(filepath.Join(out, "actions", "index.html.gz")); err != nil {
		t.Error("no precompressed HTML for gzip_static")
	}
	if sm := read("sitemap.xml"); !strings.Contains(sm, "<loc>https://ui.example/actions/button/</loc>") || strings.Contains(sm, "404") {
		t.Errorf("sitemap is wrong:\n%s", sm)
	}
}

func TestLoadReportsEveryProblem(t *testing.T) {
	root := fixture(t, map[string]map[string]string{
		"orphan":    {"README.md": strings.Replace(goodReadme, "group: actions", "group: nowhere", 1)},
		"untitled":  {"README.md": "---\ngroup: actions\ntier: 3\nstatus: done\n---\n"},
		"Bad_Name":  {"README.md": goodReadme},
		"no-front":  {"README.md": "# Just a heading\n"},
		"typo":      {"README.md": strings.Replace(goodReadme, "order: 1", "ordr: 1", 1)},
		"bad-demo":  {"README.md": goodReadme, "demo.html": "{{.Data.nope.missing}}"},
		"fine-one":  {"README.md": goodReadme},
		"also-fine": {"README.md": strings.Replace(goodReadme, "title: Button", "title: Icon button", 1)},
	})
	s, err := Load(root)
	if err == nil {
		t.Fatal("Load accepted broken components")
	}
	msg := err.Error()
	for _, want := range []string{
		`components/orphan: group "nowhere" is not in site/groups.yaml`,
		"components/untitled/README.md: title is required; summary is required; tier is 1 (CSS only) or 2 (behaviour); status is one of preview, beta, stable",
		"components/Bad_Name: folder names are lower-case",
		"components/no-front/README.md: needs front matter",
		"components/typo/README.md: front matter",
		"components/bad-demo/demo.html",
	} {
		if !strings.Contains(msg, want) {
			t.Errorf("missing error %q in:\n%s", want, msg)
		}
	}
	if n := len(s.Components); n != 2 {
		t.Errorf("loaded %d good components, want 2", n)
	}
}

// The real repository builds cleanly: every component folder is valid and
// every page renders.
func TestRealSiteBuilds(t *testing.T) {
	s, err := Load(filepath.Join("..", ".."))
	if err != nil {
		t.Fatal(err)
	}
	if len(s.Components) == 0 {
		t.Fatal("no components found")
	}
	if _, err := s.Build(filepath.Join(t.TempDir(), "dist"), Options{}); err != nil {
		t.Fatal(err)
	}
}
