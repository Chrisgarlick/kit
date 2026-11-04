package brand

import (
	"encoding/json"
	"fmt"
	"math"
	"sort"
	"strings"
)

// Token is one design token: a name without the --kit- prefix, and its CSS value.
type Token struct {
	Name, Value string
}

// Theme is a brand resolved into kit's tokens.
type Theme struct {
	Name   string
	Shared []Token // the same in every mode: type, radii
	Light  []Token
	Dark   []Token
	// Problems are failed contrast checks, as "dark: fg-3 on surface-2 is 4.21:1 (needs 4.5)".
	Problems []string
}

// kit's own series colours, used after the brand's accents.
var (
	defaultSeries = []string{"#0F766E", "#4F46E5", "#D97706", "#DB2777", "#0284C7", "#65A30D"}
	darkSeries    = []string{"#2DD4BF", "#818CF8", "#FBBF24", "#F472B6", "#38BDF8", "#A3E635"}
)

type palette struct {
	set   map[string]Colour
	order []string
}

func (p *palette) put(name string, c Colour) { p.set[name] = c; p.order = append(p.order, name) }

// Resolve works out every token for both modes, applies kit.yaml, and checks contrast.
func Resolve(f *File, o *Overrides) (*Theme, error) {
	t := &Theme{Name: f.Name}
	shared, err := sharedTokens(f)
	if err != nil {
		return nil, err
	}
	modeNames := map[string]bool{}
	for _, n := range []string{"bg", "surface", "surface-2", "surface-3", "line", "line-strong", "fg", "fg-2", "fg-3", "accent", "accent-hover", "accent-soft", "accent-fg", "focus-ring", "good", "good-soft", "warn", "warn-soft", "bad", "bad-soft", "bad-fg", "info", "info-soft", "scrim", "shadow-1", "shadow-2", "shadow-3"} {
		modeNames[n] = true
	}
	sharedOnly := map[string]string{}
	for k, v := range o.Both {
		if !modeNames[k] && !strings.HasPrefix(k, "series-") {
			sharedOnly[k] = v
		}
	}
	t.Shared = override(shared, sharedOnly)
	for _, mode := range []string{"light", "dark"} {
		p := f.Palette
		if mode == "dark" {
			if _, ok := f.Modes["dark"]; !ok {
				// No dark mode in the brand: dark stays on the light palette.
				p = f.Palette
			} else {
				p = f.mode("dark")
			}
		}
		cols, err := derive(p, mode == "dark" && f.Modes["dark"] != (Palette{}))
		if err != nil {
			return nil, fmt.Errorf("%s: %w", mode, err)
		}
		toks := make([]Token, 0, len(cols.order))
		for _, n := range cols.order {
			toks = append(toks, Token{n, cols.set[n].Hex()})
		}
		toks = append(toks, shadows(f, mode)...)
		ov := o.Light
		if mode == "dark" {
			ov = o.Dark
		}
		both := map[string]string{}
		for k, v := range o.Both {
			if _, shared := sharedOnly[k]; !shared {
				both[k] = v
			}
		}
		toks = override(override(toks, both), ov)
		t.Problems = append(t.Problems, check(mode, toks)...)
		if mode == "light" {
			t.Light = toks
		} else {
			t.Dark = toks
		}
	}
	return t, nil
}

// derive fills every colour role kit needs from a brand palette.
func derive(p Palette, dark bool) (*palette, error) {
	var bad error
	col := func(s string, fallback Colour) Colour {
		if s == "" {
			return fallback
		}
		c, err := ParseColour(s)
		if err != nil && bad == nil {
			bad = err
		}
		return c
	}
	paper := col(p.Paper, white)
	ink := col(p.Ink, black)
	surface := col(p.Surface, Mix(paper, ink, 0.04))
	inkMuted := col(p.InkMuted, Mix(ink, paper, 0.35))
	rule := col(p.Rule, Mix(paper, ink, 0.12))
	accent := col(p.Accent, black)
	accentSoft := col(p.AccentSoft, readable(accent, Mix(accent, paper, 0.9), paper))
	onAccent := col(p.OnAccent, best(accent, white, paper, ink))
	inverse := col(p.Inverse, ink)
	good := col(p.Good, mustColour("#1F7A4D"))
	fair := col(p.Fair, mustColour("#966010"))
	poor := col(p.Poor, mustColour("#B42318"))
	if bad != nil {
		return nil, bad
	}

	out := &palette{set: map[string]Colour{}}
	// Raised surfaces step from the page (light) or the panel (dark) toward the ink.
	base, s2, s3 := paper, 0.04, 0.09
	if dark {
		base, s2, s3 = surface, 0.05, 0.10
	}
	surface2 := Mix(base, ink, s2)
	out.put("bg", paper)
	out.put("surface", surface)
	out.put("surface-2", surface2)
	out.put("surface-3", Mix(base, ink, s3))
	out.put("line", rule)
	if rule.A < 1 {
		out.put("line-strong", rule.WithAlpha(math.Min(1, rule.A*2.2)))
	} else {
		out.put("line-strong", Mix(rule, ink, 0.12))
	}
	out.put("fg", ink)
	out.put("fg-2", inkMuted)
	// The third text colour: a step quieter than ink-muted, darkened (or
	// lightened) until it reads on every surface.
	fg3 := Mix(inkMuted, paper, 0.15)
	for i := 0; i < 40 && (Contrast(fg3, surface2) < 4.6 || Contrast(fg3, paper) < 4.6 || Contrast(fg3, surface) < 4.6); i++ {
		fg3 = Mix(fg3, ink, 0.08)
	}
	out.put("fg-3", fg3)
	out.put("accent", accent)
	hover := Mix(accent, ink, 0.18)
	if dark {
		hover = Mix(accent, white, 0.22)
	}
	out.put("accent-hover", hover)
	out.put("accent-soft", accentSoft)
	out.put("accent-fg", onAccent)
	out.put("focus-ring", accent)
	// Soft tints: toward white on light pages (toward a tinted paper they go
	// muddy), toward the page in dark mode.
	soft := func(c Colour) Colour {
		if dark {
			return readable(c, Mix(c, paper, 0.84), paper)
		}
		return readable(c, Mix(c, white, 0.87), white)
	}
	out.put("good", good)
	out.put("good-soft", soft(good))
	out.put("warn", fair)
	out.put("warn-soft", soft(fair))
	out.put("bad", poor)
	out.put("bad-soft", soft(poor))
	out.put("bad-fg", best(poor, white, paper, ink))
	out.put("info", hover)
	out.put("info-soft", accentSoft)
	if dark {
		out.put("scrim", black.WithAlpha(0.65))
	} else {
		out.put("scrim", inverse.WithAlpha(0.55))
	}
	// Chart series: the brand's accents (unless one is a grey), then kit's
	// own, skipping any too close to one already in.
	var series []Colour
	if chroma(accent) > 0.08 {
		series = append(series, accent)
	}
	if p.Accent2 != "" {
		a2 := col(p.Accent2, accent)
		if dark && Contrast(a2, paper) < 3 {
			a2 = Mix(a2, white, 0.4)
		}
		series = append(series, a2)
	}
	defaults := defaultSeries
	if dark {
		defaults = darkSeries
	}
	for _, s := range defaults {
		if len(series) == 6 {
			break
		}
		c := mustColour(s)
		near := false
		for _, have := range series {
			if distance(have, c) < 0.12 {
				near = true
			}
		}
		if !near {
			series = append(series, c)
		}
	}
	for i, c := range series {
		out.put(fmt.Sprintf("series-%d", i+1), c)
	}
	return out, nil
}

// sharedTokens: type and radii, the same in both modes.
func sharedTokens(f *File) ([]Token, error) {
	var out []Token
	add := func(n, v string) {
		if v != "" {
			out = append(out, Token{n, v})
		}
	}
	serif := func(name string) string {
		if strings.Contains(strings.ToLower(name), "serif") && !strings.Contains(strings.ToLower(name), "sans") {
			return "Georgia, serif"
		}
		return "system-ui, sans-serif"
	}
	display, heading, body, mono := f.Type["display"], f.Type["heading"], f.Type["body"], f.Type["mono"]
	if display.Font == "" {
		display = heading
	}
	add("font-display", fontStack(fontName(display.Font), serif(fontName(display.Font))))
	add("font-ui", fontStack(fontName(body.Font), "system-ui, sans-serif"))
	add("font-mono", fontStack(fontName(mono.Font), "ui-monospace, monospace"))
	if display.Weight != 0 {
		add("display-weight", fmt.Sprint(display.Weight))
	}
	add("display-tracking", display.Tracking)
	if sm, ok := px(f.Shape.Radius["sm"]); ok {
		add("radius-1", fmt.Sprintf("%gpx", math.Floor(sm*0.8)))
		add("radius-2", fmt.Sprintf("%gpx", sm))
	}
	if md, ok := px(f.Shape.Radius["md"]); ok {
		add("radius-3", fmt.Sprintf("%gpx", md))
	}
	return out, nil
}

// shadows from shape.shadow: three steps of the same colour.
func shadows(f *File, mode string) []Token {
	s := f.Shape.Shadow
	c, err := ParseColour(s.Color)
	if err != nil || s.Opacity == 0 {
		return nil
	}
	blur, _ := px(s.Blur)
	y, _ := px(s.Y)
	rgb := func(a float64) string {
		return fmt.Sprintf("rgb(%d %d %d / %.2f)", channel(c.R), channel(c.G), channel(c.B), a)
	}
	toks := []Token{
		{"shadow-1", fmt.Sprintf("0 1px 2px %s", rgb(s.Opacity*0.25))},
		{"shadow-2", fmt.Sprintf("0 %gpx %gpx -%gpx %s", math.Round(y*0.45), math.Round(blur*0.5), math.Round(blur*0.15), rgb(s.Opacity*0.56))},
		{"shadow-3", fmt.Sprintf("0 %gpx %gpx -%gpx %s", y, blur, math.Round(blur*0.3), rgb(s.Opacity))},
	}
	if mode == "dark" {
		toks[2].Value = fmt.Sprintf("0 %gpx %gpx -%gpx rgb(0 0 0 / 0.60)", y, blur, math.Round(blur*0.3))
	}
	return toks
}

// override replaces (or appends) tokens from kit.yaml, keeping order.
func override(toks []Token, ov map[string]string) []Token {
	seen := map[string]bool{}
	for i, t := range toks {
		if v, ok := ov[t.Name]; ok {
			toks[i].Value = v
			seen[t.Name] = true
		}
	}
	extra := make([]string, 0)
	for k := range ov {
		if !seen[k] {
			extra = append(extra, k)
		}
	}
	sort.Strings(extra)
	for _, k := range extra {
		toks = append(toks, Token{k, ov[k]})
	}
	return toks
}

// check runs the contrast rules kit relies on: text at 4.5:1 on the surfaces it sits on.
func check(mode string, toks []Token) []string {
	get := map[string]Colour{}
	for _, t := range toks {
		if c, err := ParseColour(t.Value); err == nil {
			get[t.Name] = c
		}
	}
	var out []string
	pairs := [][2]string{
		{"fg", "bg"}, {"fg", "surface"}, {"fg", "surface-2"}, {"fg", "accent-soft"},
		{"fg-2", "bg"}, {"fg-2", "surface"}, {"fg-2", "surface-2"},
		{"fg-3", "bg"}, {"fg-3", "surface"}, {"fg-3", "surface-2"},
		{"accent", "bg"}, {"accent", "surface"}, {"accent", "accent-soft"}, {"accent-fg", "accent"},
		{"good", "surface"}, {"good", "surface-2"}, {"good", "good-soft"},
		{"warn", "surface"}, {"warn", "warn-soft"},
		{"bad", "surface"}, {"bad", "bad-soft"}, {"bad-fg", "bad"},
		{"info", "info-soft"},
	}
	for _, p := range pairs {
		fg, ok1 := get[p[0]]
		bg, ok2 := get[p[1]]
		if !ok1 || !ok2 {
			continue
		}
		if r := Contrast(fg, bg.Over(get["bg"])); r < 4.5 {
			out = append(out, fmt.Sprintf("%s: %s on %s is %.2f:1 (needs 4.5)", mode, p[0], p[1], r))
		}
	}
	return out
}

// readable moves a tint toward toward until text in c reads on it (4.6:1).
func readable(c, tint, toward Colour) Colour {
	for i := 0; i < 30 && Contrast(c, tint) < 4.6; i++ {
		tint = Mix(tint, toward, 0.25)
	}
	return tint
}

// best is whichever candidate reads best on bg.
func best(bg Colour, candidates ...Colour) Colour {
	out := candidates[0]
	for _, c := range candidates[1:] {
		if Contrast(c, bg) > Contrast(out, bg) {
			out = c
		}
	}
	return out
}

func chroma(c Colour) float64 {
	return math.Max(c.R, math.Max(c.G, c.B)) - math.Min(c.R, math.Min(c.G, c.B))
}

func distance(a, b Colour) float64 {
	return math.Sqrt((a.R-b.R)*(a.R-b.R) + (a.G-b.G)*(a.G-b.G) + (a.B-b.B)*(a.B-b.B))
}

func mustColour(s string) Colour {
	c, err := ParseColour(s)
	if err != nil {
		panic(err)
	}
	return c
}

// ---- writers ----

const notice = "Generated by `kit brand` from brand.yaml and kit.yaml. Don't edit: change those and run it again."

// CSS writes kit's custom properties: light on :root, dark under both the
// media query and data-theme="dark", as tokens/tokens.css does.
func (t *Theme) CSS() string {
	var b strings.Builder
	fmt.Fprintf(&b, "/* %s theme tokens for kit. %s */\n\n", t.Name, notice)
	block := func(indent string, toks ...[]Token) {
		for _, ts := range toks {
			for _, tk := range ts {
				fmt.Fprintf(&b, "%s--kit-%s: %s;\n", indent, tk.Name, tk.Value)
			}
		}
	}
	b.WriteString(":root {\n")
	block("  ", t.Shared, t.Light)
	b.WriteString("}\n\n@media (prefers-color-scheme: dark) {\n  :root:not([data-theme=\"light\"]) {\n    color-scheme: dark;\n")
	block("    ", t.Dark)
	b.WriteString("  }\n}\n\n:root[data-theme=\"dark\"] {\n  color-scheme: dark;\n")
	block("  ", t.Dark)
	b.WriteString("}\n")
	return b.String()
}

// Typst writes the tokens as Typst dictionaries for Typeset's kit.typ.
func (t *Theme) Typst() string {
	var b strings.Builder
	fmt.Fprintf(&b, "// %s theme tokens for kit.typ. %s\n\n", t.Name, notice)
	value := func(v string) string {
		if c, err := ParseColour(v); err == nil {
			return fmt.Sprintf("rgb(%q)", c.Hex())
		}
		if n, ok := px(v); ok && strings.HasSuffix(v, "px") {
			return fmt.Sprintf("%gpt", math.Round(n*0.75*100)/100)
		}
		if strings.HasPrefix(v, "\"") {
			return strings.SplitN(v, ",", 2)[0] // the family, not the CSS fallbacks
		}
		return fmt.Sprintf("%q", v)
	}
	dict := func(name string, toks []Token) {
		fmt.Fprintf(&b, "#let %s = (\n", name)
		for _, tk := range toks {
			if strings.HasPrefix(tk.Name, "shadow") {
				continue // CSS shadows don't translate; kit.typ draws its own
			}
			fmt.Fprintf(&b, "  %q: %s,\n", tk.Name, value(tk.Value))
		}
		b.WriteString(")\n\n")
	}
	dict("kit-shared", t.Shared)
	dict("kit-light", t.Light)
	dict("kit-dark", t.Dark)
	return b.String()
}

// JSON writes the resolved tokens for Motion and the chart renderer.
func (t *Theme) JSON() ([]byte, error) {
	m := func(toks []Token) map[string]string {
		out := make(map[string]string, len(toks))
		for _, tk := range toks {
			out[tk.Name] = tk.Value
		}
		return out
	}
	b, err := json.MarshalIndent(map[string]any{
		"name": t.Name, "generated": notice, "shared": m(t.Shared), "light": m(t.Light), "dark": m(t.Dark),
	}, "", "  ")
	if err != nil {
		return nil, err
	}
	return append(b, '\n'), nil
}

// Generate loads dir's brand and returns the three generated files by name.
// Any failed contrast check is an error, listing them all.
func Generate(dir string) (map[string][]byte, error) {
	f, o, err := Load(dir)
	if err != nil {
		return nil, err
	}
	t, err := Resolve(f, o)
	if err != nil {
		return nil, err
	}
	if len(t.Problems) > 0 {
		return nil, fmt.Errorf("contrast:\n  %s\n(fix the brand, or set the token in kit.yaml)", strings.Join(t.Problems, "\n  "))
	}
	j, err := t.JSON()
	if err != nil {
		return nil, err
	}
	return map[string][]byte{"tokens.css": []byte(t.CSS()), "tokens.typ": []byte(t.Typst()), "tokens.json": j}, nil
}
