package sections

import (
	"fmt"
	"strconv"
	"strings"
)

// The expressions a section template may use, inside {{ }}, @if(), @foreach()
// and @class([]). A deliberately small slice of PHP, so a template means the
// same thing to Blade, to the compiled PHP and to kit's Go renderer:
//
//	$var  $var['key']  $list[0]       variables and indexing
//	'text'  "text"  12  1.5           literals, and true, false, null
//	!a  a && b  a || b  a ?? b        logic, and the null-coalescing default
//	a === b  a !== b                  strict comparison only (no ==)
//	a ? b : c                         a conditional
//	kit_url(x) kit_tel(x) kit_mailto(x) kit_rich(x)   kit's helpers and a few of PHP's:
//	count(x)
//	empty(x) isset(x)
//
// Anything else (assignment, method calls, other functions, ==) is an error.

type expr interface {
	eval(*scope) (any, error)
	php() string
}

// scope holds the template's variables: its props, then loop variables.
type scope struct {
	vars   map[string]any
	parent *scope
}

func (s *scope) get(name string) (any, bool) {
	for c := s; c != nil; c = c.parent {
		if v, ok := c.vars[name]; ok {
			return v, true
		}
	}
	return nil, false
}

type (
	varExpr   struct{ name string }
	indexExpr struct{ base, key expr }
	litExpr   struct{ v any }
	notExpr   struct{ x expr }
	binExpr   struct {
		op   string
		l, r expr
	}
	condExpr struct{ c, t, f expr }
	callExpr struct {
		fn   string
		args []expr
	}
)

func (e varExpr) eval(s *scope) (any, error) {
	v, ok := s.get(e.name)
	if !ok {
		return nil, fmt.Errorf("$%s isn't defined", e.name)
	}
	return v, nil
}
func (e varExpr) php() string { return "$" + e.name }

func (e indexExpr) eval(s *scope) (any, error) {
	b, err := e.base.eval(s)
	if err != nil {
		return nil, err
	}
	k, err := e.key.eval(s)
	if err != nil {
		return nil, err
	}
	switch x := b.(type) {
	// A missing key is an error, as PHP warns about it: content is filled with
	// its defaults first, so a template reads optional keys with ?? or isset.
	case map[string]any:
		key, err := str(k)
		if err != nil {
			return nil, err
		}
		v, ok := x[key]
		if !ok {
			return nil, fmt.Errorf("no key %q in %s", key, e.base.php())
		}
		return v, nil
	case []any:
		f, ok := k.(float64)
		if !ok {
			return nil, fmt.Errorf("a list is indexed by number")
		}
		i := int(f)
		if i < 0 || i >= len(x) {
			return nil, fmt.Errorf("no item %d in %s", i, e.base.php())
		}
		return x[i], nil
	case nil:
		return nil, fmt.Errorf("%s is null", e.base.php())
	}
	return nil, fmt.Errorf("can't index a %s", kind(b))
}
func (e indexExpr) php() string { return e.base.php() + "[" + e.key.php() + "]" }

func (e litExpr) eval(*scope) (any, error) { return e.v, nil }
func (e litExpr) php() string {
	switch x := e.v.(type) {
	case nil:
		return "null"
	case bool:
		if x {
			return "true"
		}
		return "false"
	case float64:
		s, _ := str(x)
		return s
	case string:
		return phpString(x)
	case []any:
		return "[]"
	}
	return "null"
}

func phpString(s string) string {
	return "'" + strings.NewReplacer(`\`, `\\`, `'`, `\'`).Replace(s) + "'"
}

func (e notExpr) eval(s *scope) (any, error) {
	v, err := e.x.eval(s)
	if err != nil {
		return nil, err
	}
	return !truthy(v), nil
}
func (e notExpr) php() string { return "!(" + e.x.php() + ")" }

func (e binExpr) eval(s *scope) (any, error) {
	if e.op == "??" {
		// a ?? b: b when a is null or missing, without an error.
		l, err := e.l.eval(s)
		if err == nil && l != nil {
			return l, nil
		}
		return e.r.eval(s)
	}
	l, err := e.l.eval(s)
	if err != nil {
		return nil, err
	}
	switch e.op {
	case "&&":
		if !truthy(l) {
			return false, nil
		}
		r, err := e.r.eval(s)
		return truthy(r), err
	case "||":
		if truthy(l) {
			return true, nil
		}
		r, err := e.r.eval(s)
		return truthy(r), err
	}
	r, err := e.r.eval(s)
	if err != nil {
		return nil, err
	}
	switch e.op {
	case "===":
		return identical(l, r), nil
	case "!==":
		return !identical(l, r), nil
	}
	return nil, fmt.Errorf("unknown operator %s", e.op)
}
func (e binExpr) php() string { return "(" + e.l.php() + " " + e.op + " " + e.r.php() + ")" }

func (e condExpr) eval(s *scope) (any, error) {
	c, err := e.c.eval(s)
	if err != nil {
		return nil, err
	}
	if truthy(c) {
		return e.t.eval(s)
	}
	return e.f.eval(s)
}
func (e condExpr) php() string { return "(" + e.c.php() + " ? " + e.t.php() + " : " + e.f.php() + ")" }

// The functions a template may call, with how many arguments each takes.
var functions = map[string]int{"kit_url": 1, "kit_tel": 1, "kit_mailto": 1, "kit_rich": 1, "count": 1, "empty": 1, "isset": 1}

func (e callExpr) eval(s *scope) (any, error) {
	if e.fn == "isset" || e.fn == "empty" {
		// Both tolerate a missing variable or key, as in PHP.
		v, err := e.args[0].eval(s)
		if e.fn == "isset" {
			return err == nil && v != nil, nil
		}
		return err != nil || !truthy(v), nil
	}
	v, err := e.args[0].eval(s)
	if err != nil {
		return nil, err
	}
	switch e.fn {
	case "kit_url":
		return safeURL(v)
	case "kit_tel":
		return tel(v)
	case "kit_mailto":
		return mailto(v)
	case "kit_rich":
		return rich(v)
	case "count":
		return count(v)
	}
	return nil, fmt.Errorf("unknown function %s", e.fn)
}
func (e callExpr) php() string {
	args := make([]string, len(e.args))
	for i, a := range e.args {
		args[i] = a.php()
	}
	return e.fn + "(" + strings.Join(args, ", ") + ")"
}

// --- parsing ---

type tok struct {
	kind string // var, ident, str, num, op, end
	text string
	pos  int
}

func lex(src string) ([]tok, error) {
	var out []tok
	i := 0
	for i < len(src) {
		c := src[i]
		switch {
		case c == ' ' || c == '\t' || c == '\n' || c == '\r':
			i++
		case c == '$':
			j := i + 1
			for j < len(src) && isIdent(src[j], j > i+1) {
				j++
			}
			if j == i+1 {
				return nil, fmt.Errorf("a $ needs a variable name (at %d)", i)
			}
			out = append(out, tok{"var", src[i+1 : j], i})
			i = j
		case isIdent(c, false):
			j := i
			for j < len(src) && isIdent(src[j], true) {
				j++
			}
			out = append(out, tok{"ident", src[i:j], i})
			i = j
		case c >= '0' && c <= '9':
			j := i
			for j < len(src) && (src[j] >= '0' && src[j] <= '9' || src[j] == '.') {
				j++
			}
			out = append(out, tok{"num", src[i:j], i})
			i = j
		case c == '\'' || c == '"':
			j := i + 1
			var b strings.Builder
			for j < len(src) && src[j] != c {
				if src[j] == '\\' && j+1 < len(src) && (src[j+1] == c || src[j+1] == '\\') {
					j++
				} else if c == '"' && (src[j] == '$' || src[j] == '\\') {
					return nil, fmt.Errorf("double-quoted strings can't contain $ or \\ (at %d): use single quotes", j)
				}
				b.WriteByte(src[j])
				j++
			}
			if j >= len(src) {
				return nil, fmt.Errorf("unterminated string (at %d)", i)
			}
			out = append(out, tok{"str", b.String(), i})
			i = j + 1
		default:
			matched := false
			for _, op := range []string{"===", "!==", "&&", "||", "??", "=>", "!", "?", ":", "(", ")", "[", "]", ","} {
				if strings.HasPrefix(src[i:], op) {
					out = append(out, tok{"op", op, i})
					i += len(op)
					matched = true
					break
				}
			}
			if !matched {
				if strings.HasPrefix(src[i:], "==") || strings.HasPrefix(src[i:], "!=") {
					return nil, fmt.Errorf("use === or !== (strict comparison) (at %d)", i)
				}
				return nil, fmt.Errorf("unexpected %q (at %d)", string(c), i)
			}
		}
	}
	return append(out, tok{"end", "", len(src)}), nil
}

func isIdent(c byte, rest bool) bool {
	return c == '_' || c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || rest && c >= '0' && c <= '9'
}

type parser struct {
	toks []tok
	i    int
}

func (p *parser) peek() tok { return p.toks[p.i] }
func (p *parser) next() tok { t := p.toks[p.i]; p.i++; return t }
func (p *parser) isOp(op string) bool {
	t := p.peek()
	return t.kind == "op" && t.text == op
}
func (p *parser) expect(op string) error {
	if !p.isOp(op) {
		t := p.peek()
		return fmt.Errorf("expected %q, found %q (at %d)", op, t.text, t.pos)
	}
	p.i++
	return nil
}

// parseExpr parses one whole expression.
func parseExpr(src string) (expr, error) {
	toks, err := lex(src)
	if err != nil {
		return nil, err
	}
	p := &parser{toks: toks}
	e, err := p.ternary()
	if err != nil {
		return nil, err
	}
	if p.peek().kind != "end" {
		return nil, fmt.Errorf("unexpected %q (at %d)", p.peek().text, p.peek().pos)
	}
	return e, nil
}

func (p *parser) ternary() (expr, error) {
	c, err := p.coalesce()
	if err != nil {
		return nil, err
	}
	if !p.isOp("?") {
		return c, nil
	}
	p.next()
	// A nested conditional needs brackets, as PHP 8 requires: the Blade
	// source is run as written.
	t, err := p.coalesce()
	if err != nil {
		return nil, err
	}
	if err := p.expect(":"); err != nil {
		return nil, err
	}
	f, err := p.coalesce()
	if err != nil {
		return nil, err
	}
	return condExpr{c, t, f}, nil
}

func (p *parser) coalesce() (expr, error) {
	l, err := p.or()
	if err != nil {
		return nil, err
	}
	if p.isOp("??") {
		p.next()
		r, err := p.coalesce()
		if err != nil {
			return nil, err
		}
		return binExpr{"??", l, r}, nil
	}
	return l, nil
}

func (p *parser) or() (expr, error) {
	l, err := p.and()
	for err == nil && p.isOp("||") {
		p.next()
		var r expr
		r, err = p.and()
		l = binExpr{"||", l, r}
	}
	return l, err
}

func (p *parser) and() (expr, error) {
	l, err := p.cmp()
	for err == nil && p.isOp("&&") {
		p.next()
		var r expr
		r, err = p.cmp()
		l = binExpr{"&&", l, r}
	}
	return l, err
}

func (p *parser) cmp() (expr, error) {
	l, err := p.unary()
	if err != nil {
		return nil, err
	}
	if p.isOp("===") || p.isOp("!==") {
		op := p.next().text
		r, err := p.unary()
		if err != nil {
			return nil, err
		}
		return binExpr{op, l, r}, nil
	}
	return l, nil
}

func (p *parser) unary() (expr, error) {
	if p.isOp("!") {
		p.next()
		x, err := p.unary()
		return notExpr{x}, err
	}
	return p.postfix()
}

func (p *parser) postfix() (expr, error) {
	e, err := p.primary()
	if err != nil {
		return nil, err
	}
	for p.isOp("[") {
		p.next()
		k, err := p.ternary()
		if err != nil {
			return nil, err
		}
		if err := p.expect("]"); err != nil {
			return nil, err
		}
		e = indexExpr{e, k}
	}
	return e, nil
}

func (p *parser) primary() (expr, error) {
	t := p.next()
	switch t.kind {
	case "var":
		return varExpr{t.text}, nil
	case "str":
		return litExpr{t.text}, nil
	case "num":
		f, err := strconv.ParseFloat(t.text, 64)
		if err != nil {
			return nil, fmt.Errorf("bad number %q", t.text)
		}
		return litExpr{f}, nil
	case "ident":
		switch strings.ToLower(t.text) {
		case "true":
			return litExpr{true}, nil
		case "false":
			return litExpr{false}, nil
		case "null":
			return litExpr{nil}, nil
		}
		n, ok := functions[t.text]
		if !ok {
			return nil, fmt.Errorf("%s isn't allowed in a kit section template (only kit_url, kit_tel, kit_mailto, kit_rich, count, empty, isset)", t.text)
		}
		if err := p.expect("("); err != nil {
			return nil, err
		}
		var args []expr
		for !p.isOp(")") {
			a, err := p.ternary()
			if err != nil {
				return nil, err
			}
			args = append(args, a)
			if !p.isOp(",") {
				break
			}
			p.next()
		}
		if err := p.expect(")"); err != nil {
			return nil, err
		}
		if len(args) != n {
			return nil, fmt.Errorf("%s takes %d argument", t.text, n)
		}
		return callExpr{t.text, args}, nil
	case "op":
		if t.text == "[" {
			// Only the empty array, for a prop's default: @props(['content' => []]).
			if err := p.expect("]"); err != nil {
				return nil, fmt.Errorf("only an empty array [] is allowed here")
			}
			return litExpr{[]any{}}, nil
		}
		if t.text == "(" {
			e, err := p.ternary()
			if err != nil {
				return nil, err
			}
			return e, p.expect(")")
		}
	}
	return nil, fmt.Errorf("unexpected %q (at %d)", t.text, t.pos)
}

// parseArray parses a literal array for @props and @class: ['a', 'b' => x].
// Each entry has a string key (or none) and an expression value.
type arrayEntry struct {
	key   string
	keyed bool
	value expr
}

func parseArray(src string) ([]arrayEntry, error) {
	toks, err := lex(src)
	if err != nil {
		return nil, err
	}
	p := &parser{toks: toks}
	if err := p.expect("["); err != nil {
		return nil, err
	}
	var out []arrayEntry
	for !p.isOp("]") {
		v, err := p.ternary()
		if err != nil {
			return nil, err
		}
		entry := arrayEntry{value: v}
		if p.isOp("=>") {
			p.next()
			k, ok := v.(litExpr)
			ks, isStr := k.v.(string)
			if !ok || !isStr {
				return nil, fmt.Errorf("array keys must be quoted strings")
			}
			val, err := p.ternary()
			if err != nil {
				return nil, err
			}
			entry = arrayEntry{key: ks, keyed: true, value: val}
		}
		out = append(out, entry)
		if !p.isOp(",") {
			break
		}
		p.next()
	}
	if err := p.expect("]"); err != nil {
		return nil, err
	}
	if p.peek().kind != "end" {
		return nil, fmt.Errorf("unexpected %q after the array", p.peek().text)
	}
	return out, nil
}
