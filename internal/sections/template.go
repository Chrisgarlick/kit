package sections

import (
	"fmt"
	"regexp"
	"strings"
)

// A section template is written once, in a small subset of Blade, and used
// three ways: by Blade itself (Laravel, cg-cms, WordPress with Acorn), as
// plain PHP compiled from it (WordPress without Blade), and by kit's Go
// renderer (the docs site and the checks). The subset:
//
//	{{ expr }}                        escaped output
//	{{-- comment --}}                 left out
//	@props(['content' => [], ...])    the template's inputs, first
//	@if(expr) @elseif(expr) @else @endif
//	@foreach($list as $item) @foreach($list as $i => $item) @endforeach
//	@isset(expr) @endisset
//	@class(['always', 'when' => expr])   inside a tag
//	@@word  @{{                       a literal @word or {{
//
// Not allowed: {!! !!} (raw output), @php, @include and the other Blade
// directives, <?php, and <x-…> components (nested sections come later).
//
// Whitespace follows Blade exactly: PHP drops a newline straight after a
// closing ?>, so a newline after a control directive disappears, and Blade
// doubles the newline after {{ }} so that one survives. Getting this right
// is what lets the three outputs match byte for byte.

// Template is a parsed section template.
type Template struct {
	Name  string
	Props []Prop
	body  []node
}

// Prop is one of the template's inputs, with its default.
type Prop struct {
	Name    string
	Default any
}

type node interface{}

type (
	textNode  struct{ s string }
	echoNode  struct{ e expr }
	classNode struct{ entries []classEntry }
	ifNode    struct {
		branches []branch
		els      []node
		hasElse  bool
		nl       []bool // per directive (each @if/@elseif, @else, @endif): was it followed by a newline
	}
	branch struct {
		cond expr
		body []node
	}
	foreachNode struct {
		list     expr
		key, val string
		body     []node
		nlOpen   bool
		nlClose  bool
	}
)

// Directives other Blade templates use that a kit section may not: their
// meaning would differ between Blade, the compiled PHP and kit, or they reach
// outside the section.
var forbidden = map[string]bool{
	"php": true, "endphp": true, "include": true, "includeIf": true, "includeWhen": true, "includeUnless": true,
	"includeFirst": true, "each": true, "extends": true, "section": true, "endsection": true, "yield": true,
	"show": true, "stop": true, "parent": true, "stack": true, "push": true, "endpush": true, "prepend": true,
	"once": true, "verbatim": true, "json": true, "js": true, "inject": true, "csrf": true, "method": true,
	"component": true, "endcomponent": true, "slot": true, "endslot": true, "unless": true, "endunless": true,
	"switch": true, "case": true, "for": true, "endfor": true, "while": true, "endwhile": true,
	"forelse": true, "endforelse": true, "empty": true, "endempty": true, "break": true, "continue": true,
	"auth": true, "guest": true, "can": true, "cannot": true, "env": true, "production": true, "error": true,
	"aware": true, "use": true, "dd": true, "dump": true, "livewire": true, "vite": true, "style": true,
	"checked": true, "selected": true, "disabled": true, "readonly": true, "required": true, "fragment": true,
}

var directiveRe = regexp.MustCompile(`^@(\w+)`)

// Parse reads a template. Errors name the line.
func Parse(name, src string) (*Template, error) {
	src = strings.ReplaceAll(src, "\r\n", "\n")
	t := &Template{Name: name}
	p := &tparser{src: src, name: name}
	body, end, err := p.nodes(t, true)
	if err != nil {
		return nil, err
	}
	if end != "" {
		return nil, p.errAt(p.i, "@%s without its opening directive", end)
	}
	t.body = body
	return t, nil
}

type tparser struct {
	src   string
	name  string
	i     int
	props bool
}

func (p *tparser) errAt(pos int, format string, args ...any) error {
	line := strings.Count(p.src[:min(pos, len(p.src))], "\n") + 1
	return fmt.Errorf("%s:%d: %s", p.name, line, fmt.Sprintf(format, args...))
}

// nodes reads until the end of the source or a closing directive (endif,
// elseif, else, endforeach, endisset). It consumes the closing directive and
// returns its name.
func (p *tparser) nodes(t *Template, top bool) ([]node, string, error) {
	var out []node
	var text strings.Builder
	flush := func() {
		if text.Len() > 0 {
			out = append(out, textNode{text.String()})
			text.Reset()
		}
	}
	for p.i < len(p.src) {
		rest := p.src[p.i:]
		switch {
		case strings.HasPrefix(rest, "{{--"):
			end := strings.Index(rest, "--}}")
			if end < 0 {
				return nil, "", p.errAt(p.i, "unterminated {{-- comment")
			}
			p.i += end + 4
		case strings.HasPrefix(rest, "{!!"):
			return nil, "", p.errAt(p.i, "{!! !!} (unescaped output) isn't allowed: use kit_rich() for rich text")
		case strings.HasPrefix(rest, "@{{"):
			text.WriteString("{{")
			p.i += 3
		case strings.HasPrefix(rest, "{{"):
			end := strings.Index(rest, "}}")
			if end < 0 {
				return nil, "", p.errAt(p.i, "unterminated {{")
			}
			e, err := parseExpr(strings.TrimSpace(rest[2:end]))
			if err != nil {
				return nil, "", p.errAt(p.i, "%v", err)
			}
			flush()
			out = append(out, echoNode{e})
			p.i += end + 2
		case strings.HasPrefix(rest, "<?"):
			return nil, "", p.errAt(p.i, "<?php isn't allowed in a section template")
		case strings.HasPrefix(rest, "<x-"):
			return nil, "", p.errAt(p.i, "components (<x-…>) aren't supported in sections yet")
		case strings.HasPrefix(rest, "@@") && len(rest) > 2 && isIdent(rest[2], true):
			// @@word is a literal @word, as in Blade.
			text.WriteString("@")
			p.i += 2
			m := directiveRe.FindString(rest[1:])
			text.WriteString(m[1:])
			p.i += len(m) - 1
		case rest[0] == '@' && (p.i == 0 || !isIdent(p.src[p.i-1], true)):
			m := directiveRe.FindStringSubmatch(rest)
			if m == nil {
				text.WriteByte('@')
				p.i++
				continue
			}
			name := m[1]
			if forbidden[name] {
				return nil, "", p.errAt(p.i, "@%s isn't allowed in a kit section template", name)
			}
			switch name {
			case "if", "foreach", "isset", "class", "props":
			case "elseif", "else", "endif", "endforeach", "endisset":
				flush()
				p.i += len(m[0])
				return out, name, nil
			default:
				// Not a directive kit knows: text, as Blade leaves it.
				text.WriteString(m[0])
				p.i += len(m[0])
				continue
			}
			flush()
			start := p.i
			p.i += len(m[0])
			args, err := p.args(start)
			if err != nil {
				return nil, "", err
			}
			switch name {
			case "props":
				if !top || p.props || len(out) > 0 && !onlyWhitespace(out) {
					return nil, "", p.errAt(start, "@props comes once, first")
				}
				p.props = true
				entries, err := parseArray(args)
				if err != nil {
					return nil, "", p.errAt(start, "@props: %v", err)
				}
				for _, e := range entries {
					lit, ok := e.value.(litExpr)
					if !e.keyed || !ok {
						return nil, "", p.errAt(start, "@props entries are 'name' => default, the default a literal")
					}
					t.Props = append(t.Props, Prop{e.key, lit.v})
				}
				p.eatNewline()
			case "class":
				entries, err := parseArray(args)
				if err != nil {
					return nil, "", p.errAt(start, "@class: %v", err)
				}
				var ce []classEntry
				for _, e := range entries {
					if e.keyed {
						if !classNameRe.MatchString(e.key) {
							return nil, "", p.errAt(start, "@class: %q isn't a plain class name", e.key)
						}
						ce = append(ce, classEntry{e.key, e.value})
						continue
					}
					lit, ok := e.value.(litExpr)
					s, isStr := lit.v.(string)
					if !ok || !isStr || !classNameRe.MatchString(s) {
						return nil, "", p.errAt(start, "@class: unkeyed entries are plain class names in quotes")
					}
					ce = append(ce, classEntry{name: s})
				}
				out = append(out, classNode{ce})
			case "if", "isset":
				n, err := p.ifBlock(t, name, args, start)
				if err != nil {
					return nil, "", err
				}
				out = append(out, n)
			case "foreach":
				n, err := p.foreachBlock(t, args, start)
				if err != nil {
					return nil, "", err
				}
				out = append(out, n)
			}
		default:
			text.WriteByte(p.src[p.i])
			p.i++
		}
	}
	flush()
	return out, "", nil
}

var classNameRe = regexp.MustCompile(`^[a-z][a-z0-9_-]*$`)

func onlyWhitespace(nodes []node) bool {
	for _, n := range nodes {
		t, ok := n.(textNode)
		if !ok || strings.TrimSpace(t.s) != "" {
			return false
		}
	}
	return true
}

// args reads a directive's parenthesised arguments, balanced, minding strings.
func (p *tparser) args(start int) (string, error) {
	j := p.i
	for j < len(p.src) && (p.src[j] == ' ' || p.src[j] == '\t') {
		j++
	}
	if j >= len(p.src) || p.src[j] != '(' {
		return "", p.errAt(start, "@%s needs its arguments in brackets", directiveRe.FindStringSubmatch(p.src[start:])[1])
	}
	depth := 0
	var quote byte
	for k := j; k < len(p.src); k++ {
		c := p.src[k]
		switch {
		case quote != 0:
			if c == '\\' {
				k++
			} else if c == quote {
				quote = 0
			}
		case c == '\'' || c == '"':
			quote = c
		case c == '(':
			depth++
		case c == ')':
			depth--
			if depth == 0 {
				p.i = k + 1
				return p.src[j+1 : k], nil
			}
		}
	}
	return "", p.errAt(start, "unbalanced brackets")
}

// eatNewline drops one newline straight after a directive, as PHP does after ?>.
func (p *tparser) eatNewline() bool {
	if p.i < len(p.src) && p.src[p.i] == '\n' {
		p.i++
		return true
	}
	return false
}

func (p *tparser) ifBlock(t *Template, name, args string, start int) (node, error) {
	cond, err := parseExpr(args)
	if err != nil {
		return nil, p.errAt(start, "@%s: %v", name, err)
	}
	if name == "isset" {
		if !isLvalue(cond) {
			return nil, p.errAt(start, "@isset takes a variable or a key")
		}
		cond = callExpr{"isset", []expr{cond}}
	}
	n := &ifNode{}
	n.nl = append(n.nl, p.eatNewline())
	for {
		body, end, err := p.nodes(t, false)
		if err != nil {
			return nil, err
		}
		if name == "isset" {
			if end != "endisset" {
				return nil, p.errAt(start, "@isset needs @endisset")
			}
			n.branches = append(n.branches, branch{cond, body})
			n.nl = append(n.nl, p.eatNewline())
			return n, nil
		}
		switch end {
		case "elseif":
			if n.hasElse {
				return nil, p.errAt(p.i, "@elseif after @else")
			}
			n.branches = append(n.branches, branch{cond, body})
			a, err := p.args(p.i - len("@elseif"))
			if err != nil {
				return nil, err
			}
			if cond, err = parseExpr(a); err != nil {
				return nil, p.errAt(p.i, "@elseif: %v", err)
			}
			n.nl = append(n.nl, p.eatNewline())
		case "else":
			if n.hasElse {
				return nil, p.errAt(p.i, "two @else")
			}
			n.branches = append(n.branches, branch{cond, body})
			n.hasElse = true
			cond = nil
			n.nl = append(n.nl, p.eatNewline())
		case "endif":
			if n.hasElse {
				n.els = body
			} else {
				n.branches = append(n.branches, branch{cond, body})
			}
			n.nl = append(n.nl, p.eatNewline())
			return n, nil
		default:
			return nil, p.errAt(start, "@if needs @endif")
		}
	}
}

func isLvalue(e expr) bool {
	switch x := e.(type) {
	case varExpr:
		return true
	case indexExpr:
		return isLvalue(x.base)
	}
	return false
}

var foreachRe = regexp.MustCompile(`^\s*(.+?)\s+as\s+\$(\w+)(?:\s*=>\s*\$(\w+))?\s*$`)

func (p *tparser) foreachBlock(t *Template, args string, start int) (node, error) {
	m := foreachRe.FindStringSubmatch(args)
	if m == nil {
		return nil, p.errAt(start, "@foreach is ($list as $item) or ($list as $i => $item)")
	}
	list, err := parseExpr(m[1])
	if err != nil {
		return nil, p.errAt(start, "@foreach: %v", err)
	}
	n := &foreachNode{list: list, val: m[2]}
	if m[3] != "" {
		n.key, n.val = m[2], m[3]
	}
	n.nlOpen = p.eatNewline()
	body, end, err := p.nodes(t, false)
	if err != nil {
		return nil, err
	}
	if end != "endforeach" {
		return nil, p.errAt(start, "@foreach needs @endforeach")
	}
	n.body = body
	n.nlClose = p.eatNewline()
	return n, nil
}

// --- rendering in Go ---

// Render runs the template with these props (missing ones take their
// defaults) and returns the HTML.
func (t *Template) Render(props map[string]any) (string, error) {
	vars := map[string]any{}
	for _, p := range t.Props {
		if v, ok := props[p.Name]; ok {
			vars[p.Name] = v
		} else {
			vars[p.Name] = p.Default
		}
	}
	var b strings.Builder
	if err := render(&b, t.body, &scope{vars: vars}); err != nil {
		return "", fmt.Errorf("%s: %w", t.Name, err)
	}
	// Blade left-trims a view's output (PhpEngine::evaluatePath), and so does
	// kit_section().
	return strings.TrimLeft(b.String(), " \t\n\r\x00\x0B"), nil
}

func render(b *strings.Builder, nodes []node, s *scope) error {
	for _, n := range nodes {
		switch x := n.(type) {
		case textNode:
			b.WriteString(x.s)
		case echoNode:
			v, err := x.e.eval(s)
			if err != nil {
				return err
			}
			out, err := echo(v)
			if err != nil {
				return err
			}
			b.WriteString(out)
		case classNode:
			c, err := classList(x.entries, s)
			if err != nil {
				return err
			}
			b.WriteString(`class="` + escape(c) + `"`)
		case *ifNode:
			done := false
			for _, br := range x.branches {
				v, err := br.cond.eval(s)
				if err != nil {
					return err
				}
				if truthy(v) {
					if err := render(b, br.body, s); err != nil {
						return err
					}
					done = true
					break
				}
			}
			if !done && x.hasElse {
				if err := render(b, x.els, s); err != nil {
					return err
				}
			}
		case *foreachNode:
			v, err := x.list.eval(s)
			if err != nil {
				return err
			}
			if v == nil {
				return fmt.Errorf("@foreach over a missing list")
			}
			list, ok := v.([]any)
			if !ok {
				return fmt.Errorf("@foreach needs a list, not a %s", kind(v))
			}
			for i, item := range list {
				inner := &scope{vars: map[string]any{x.val: item}, parent: s}
				if x.key != "" {
					inner.vars[x.key] = float64(i)
				}
				if err := render(b, x.body, inner); err != nil {
					return err
				}
			}
		}
	}
	return nil
}

// --- compiling to PHP ---

// PHP compiles the template to plain PHP: a file that returns a function
// taking the props as named arguments and printing the section. It needs
// kit's runtime (kit.php) for kit_e(), kit_url(), kit_rich() and kit_classes().
func (t *Template) PHP(source string) string {
	var b strings.Builder
	b.WriteString("<?php\n")
	fmt.Fprintf(&b, "// Compiled by kit from %s. Don't edit it: change the template and run `kit section compile`.\n", source)
	params := make([]string, len(t.Props))
	for i, p := range t.Props {
		params[i] = "$" + p.Name + " = " + litExpr{p.Default}.php()
	}
	fmt.Fprintf(&b, "return function (%s): void {\n?>", strings.Join(params, ", "))
	w := &phpWriter{b: &b, after: true} // the function opens with ?>
	w.nodes(t.body)
	b.WriteString("<?php\n};\n")
	return b.String()
}

type phpWriter struct {
	b *strings.Builder
	// after is set straight after a ?> whose following newline PHP would eat.
	after bool
}

// code writes a PHP block. eatNL is true when the template had a newline
// after this directive, which PHP (and Blade) drop: one is written to be eaten.
func (w *phpWriter) code(src string, eatNL bool) {
	w.b.WriteString("<?php " + src + " ?>")
	if eatNL {
		w.b.WriteString("\n")
		w.after = false
		return
	}
	w.after = true
}

func (w *phpWriter) text(s string) {
	if s == "" {
		return
	}
	if w.after && strings.HasPrefix(s, "\n") {
		// PHP would eat this newline after ?>; Blade doubles it after an echo.
		w.b.WriteString("\n")
	}
	w.after = false
	w.b.WriteString(s)
}

func (w *phpWriter) nodes(nodes []node) {
	for _, n := range nodes {
		switch x := n.(type) {
		case textNode:
			w.text(x.s)
		case echoNode:
			w.code("echo kit_e("+x.e.php()+");", false)
		case classNode:
			parts := make([]string, len(x.entries))
			for i, e := range x.entries {
				if e.cond == nil {
					parts[i] = phpString(e.name)
				} else {
					parts[i] = phpString(e.name) + " => " + e.cond.php()
				}
			}
			w.text(`class="`)
			w.code("echo kit_e(kit_classes(["+strings.Join(parts, ", ")+"]));", false)
			w.text(`"`)
		case *ifNode:
			nl := 0
			for i, br := range x.branches {
				if i == 0 {
					w.code("if ("+br.cond.php()+"):", x.nl[nl])
				} else {
					w.code("elseif ("+br.cond.php()+"):", x.nl[nl])
				}
				nl++
				w.nodes(br.body)
			}
			if x.hasElse {
				w.code("else:", x.nl[nl])
				nl++
				w.nodes(x.els)
			}
			w.code("endif;", x.nl[nl])
		case *foreachNode:
			as := "$" + x.val
			if x.key != "" {
				as = "$" + x.key + " => $" + x.val
			}
			w.code("foreach ("+x.list.php()+" as "+as+"):", x.nlOpen)
			w.nodes(x.body)
			w.code("endforeach;", x.nlClose)
		}
	}
}
