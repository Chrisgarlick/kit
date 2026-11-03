// Package site builds ui.chrisgarlick.com: a static site assembled from the
// component folders (components/<name>/README.md, demo.html, *.css), the
// group list (site/groups.yaml), the placeholder data (site/data/*.yaml), the
// design tokens (tokens/tokens.css) and the page templates (site/templates).
//
// Adding a component is adding a folder: it appears on its group's page, in
// the navigation and in the sitemap with no page to edit.
package site

import (
	"bytes"
	"errors"
	"fmt"
	"html/template"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"sort"
	"strings"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	"gopkg.in/yaml.v3"
)

// Group is one page of components, such as Actions.
type Group struct {
	ID         string   `yaml:"id"`
	Title      string   `yaml:"title"`
	Summary    string   `yaml:"summary"`
	Planned    []string `yaml:"planned"`
	Components []*Component
}

// URL is the group's page.
func (g *Group) URL() string { return "/" + g.ID + "/" }

// Upcoming is the planned list without the components that have shipped.
func (g *Group) Upcoming() []string {
	var out []string
	for _, p := range g.Planned {
		if !slices.ContainsFunc(g.Components, func(c *Component) bool { return strings.EqualFold(c.Title, p) }) {
			out = append(out, p)
		}
	}
	return out
}

// Component is one folder under components/.
type Component struct {
	Slug    string `yaml:"-"`
	Title   string `yaml:"title"`
	Group   string `yaml:"group"`
	Summary string `yaml:"summary"`
	Pattern string `yaml:"pattern"`
	Status  string `yaml:"status"`
	Order   int    `yaml:"order"`
	Tier    int    `yaml:"tier"`

	Body template.HTML `yaml:"-"` // the README below its front matter
	Demo template.HTML `yaml:"-"` // demo.html, run against the placeholder data
	CSS  []string      `yaml:"-"` // stylesheets, relative to the root
	JS   []string      `yaml:"-"` // tier 2 modules, relative to the root

	group *Group
}

// URL is the component's own page.
func (c *Component) URL() string { return "/" + c.Group + "/" + c.Slug + "/" }

// GroupTitle is the title of the component's group.
func (c *Component) GroupTitle() string { return c.group.Title }

// Token is one custom property from tokens/tokens.css (the light values).
type Token struct {
	Name  string // without the leading --
	Value string
}

// Site is everything the pages are built from.
type Site struct {
	Root       string
	Groups     []*Group
	Components []*Component
	Data       map[string]any
	Tokens     []Token
}

var (
	statuses = []string{"preview", "beta", "stable"}
	slugRe   = regexp.MustCompile(`^[a-z][a-z0-9-]*$`)
	tokenRe  = regexp.MustCompile(`--(kit-[a-z0-9-]+)\s*:\s*([^;]+);`)
)

// Load reads and checks the site under root. Every problem is reported, not
// only the first.
func Load(root string) (*Site, error) {
	root, err := filepath.Abs(root)
	if err != nil {
		return nil, err
	}
	s := &Site{Root: root, Data: map[string]any{}}
	var errs []error

	gb, err := os.ReadFile(filepath.Join(root, "site", "groups.yaml"))
	if err != nil {
		return nil, err
	}
	if err := yaml.Unmarshal(gb, &s.Groups); err != nil {
		return nil, fmt.Errorf("site/groups.yaml: %w", err)
	}
	byID := map[string]*Group{}
	for _, g := range s.Groups {
		if !slugRe.MatchString(g.ID) || g.Title == "" {
			errs = append(errs, fmt.Errorf("site/groups.yaml: group %q needs a lower-case id and a title", g.ID))
		}
		byID[g.ID] = g
	}

	dataFiles, _ := filepath.Glob(filepath.Join(root, "site", "data", "*.yaml"))
	for _, f := range dataFiles {
		b, err := os.ReadFile(f)
		if err != nil {
			return nil, err
		}
		var m map[string]any
		if err := yaml.Unmarshal(b, &m); err != nil {
			errs = append(errs, fmt.Errorf("%s: %w", rel(root, f), err))
			continue
		}
		for k, v := range m {
			if _, dup := s.Data[k]; dup {
				errs = append(errs, fmt.Errorf("%s: key %q is already defined by another data file", rel(root, f), k))
			}
			s.Data[k] = v
		}
	}

	s.Tokens, err = readTokens(filepath.Join(root, "tokens", "tokens.css"))
	if err != nil {
		return nil, err
	}

	md := goldmark.New(goldmark.WithExtensions(extension.GFM), goldmark.WithParserOptions(parser.WithAutoHeadingID()))
	dirs, err := os.ReadDir(filepath.Join(root, "components"))
	if err != nil {
		return nil, err
	}
	for _, d := range dirs {
		if !d.IsDir() {
			continue
		}
		c, err := loadComponent(root, d.Name(), md, s.Data)
		if err != nil {
			errs = append(errs, err)
			continue
		}
		g := byID[c.Group]
		if g == nil {
			errs = append(errs, fmt.Errorf("components/%s: group %q is not in site/groups.yaml", c.Slug, c.Group))
			continue
		}
		c.group = g
		g.Components = append(g.Components, c)
		s.Components = append(s.Components, c)
	}
	for _, g := range s.Groups {
		sort.SliceStable(g.Components, func(i, j int) bool {
			a, b := g.Components[i], g.Components[j]
			if a.Order != b.Order {
				return a.Order < b.Order
			}
			return a.Title < b.Title
		})
	}
	return s, errors.Join(errs...)
}

func loadComponent(root, slug string, md goldmark.Markdown, data map[string]any) (*Component, error) {
	dir := filepath.Join(root, "components", slug)
	where := "components/" + slug
	if !slugRe.MatchString(slug) {
		return nil, fmt.Errorf("%s: folder names are lower-case letters, digits and dashes", where)
	}
	raw, err := os.ReadFile(filepath.Join(dir, "README.md"))
	if err != nil {
		return nil, fmt.Errorf("%s: %w", where, err)
	}
	front, body, ok := splitFrontMatter(raw)
	if !ok {
		return nil, fmt.Errorf("%s/README.md: needs front matter between --- lines", where)
	}
	c := &Component{Slug: slug}
	dec := yaml.NewDecoder(bytes.NewReader(front))
	dec.KnownFields(true)
	if err := dec.Decode(c); err != nil {
		return nil, fmt.Errorf("%s/README.md: front matter: %w", where, err)
	}
	var problems []string
	if c.Title == "" {
		problems = append(problems, "title is required")
	}
	if c.Group == "" {
		problems = append(problems, "group is required")
	}
	if c.Summary == "" {
		problems = append(problems, "summary is required")
	}
	if c.Tier != 1 && c.Tier != 2 {
		problems = append(problems, "tier is 1 (CSS only) or 2 (behaviour)")
	}
	if !slices.Contains(statuses, c.Status) {
		problems = append(problems, "status is one of "+strings.Join(statuses, ", "))
	}
	if len(problems) > 0 {
		return nil, fmt.Errorf("%s/README.md: %s", where, strings.Join(problems, "; "))
	}

	var html bytes.Buffer
	if err := md.Convert(body, &html); err != nil {
		return nil, fmt.Errorf("%s/README.md: %w", where, err)
	}
	c.Body = template.HTML(html.String()) //nolint:gosec // Markdown rendered by goldmark, which escapes raw HTML

	if b, err := os.ReadFile(filepath.Join(dir, "demo.html")); err == nil {
		t, err := template.New(slug).Option("missingkey=error").Funcs(demoFuncs).Parse(string(b))
		if err != nil {
			return nil, fmt.Errorf("%s/demo.html: %w", where, err)
		}
		var out bytes.Buffer
		if err := t.Execute(&out, map[string]any{"Data": data}); err != nil {
			return nil, fmt.Errorf("%s/demo.html: %w", where, err)
		}
		c.Demo = template.HTML(out.String()) //nolint:gosec // html/template output
	} else if !errors.Is(err, os.ErrNotExist) {
		return nil, err
	}

	css, _ := filepath.Glob(filepath.Join(dir, "*.css"))
	for _, f := range css {
		c.CSS = append(c.CSS, rel(root, f))
	}
	js, _ := filepath.Glob(filepath.Join(dir, "*.js"))
	for _, f := range js {
		if !strings.HasSuffix(f, ".test.js") {
			c.JS = append(c.JS, rel(root, f))
		}
	}
	if c.Tier == 2 && len(c.JS) == 0 && c.Status != "preview" {
		return nil, fmt.Errorf("%s: a tier 2 component past preview needs its .js", where)
	}
	return c, nil
}

// splitFrontMatter separates a leading ---\n…\n--- block from the rest.
func splitFrontMatter(b []byte) (front, body []byte, ok bool) {
	b = bytes.ReplaceAll(b, []byte("\r\n"), []byte("\n"))
	if !bytes.HasPrefix(b, []byte("---\n")) {
		return nil, nil, false
	}
	rest := b[4:]
	end := bytes.Index(rest, []byte("\n---\n"))
	if end < 0 {
		return nil, nil, false
	}
	return rest[:end], rest[end+5:], true
}

// readTokens returns the custom properties of the first :root block (the
// light theme), in file order.
func readTokens(path string) ([]Token, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	src := string(b)
	start := strings.Index(src, ":root {")
	if start < 0 {
		return nil, fmt.Errorf("%s: no :root block", path)
	}
	end := strings.Index(src[start:], "\n}")
	if end < 0 {
		return nil, fmt.Errorf("%s: unterminated :root block", path)
	}
	var out []Token
	for _, m := range tokenRe.FindAllStringSubmatch(src[start:start+end], -1) {
		out = append(out, Token{Name: m[1], Value: strings.TrimSpace(m[2])})
	}
	return out, nil
}

// TokensWith returns the tokens whose names start with one of the prefixes.
func (s *Site) TokensWith(prefixes ...string) []Token {
	var out []Token
	for _, t := range s.Tokens {
		for _, p := range prefixes {
			if strings.HasPrefix(t.Name, p) {
				out = append(out, t)
				break
			}
		}
	}
	return out
}

func rel(root, p string) string {
	r, err := filepath.Rel(root, p)
	if err != nil {
		return p
	}
	return filepath.ToSlash(r)
}

// demoFuncs are the helpers a demo.html can call.
var demoFuncs = template.FuncMap{"inc": func(i int) int { return i + 1 }}
