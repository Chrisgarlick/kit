package sections

import (
	"errors"
	"fmt"
	"slices"
	"sort"
)

// Check compares a template with its schema: every $content['field'] the
// template reads (and every $item['field'] inside a loop over a list) must be
// a field, every field must be read somewhere, and the props must be
// $content and $variant. It catches a renamed field before a page breaks.
func Check(t *Template, s *Schema) error {
	var errs []error
	wantProps := []Prop{{"content", []any{}}, {"variant", s.Variants[0].Name}}
	if len(t.Props) != 2 || t.Props[0].Name != "content" || t.Props[1].Name != "variant" || !identical(t.Props[1].Default, wantProps[1].Default) {
		errs = append(errs, fmt.Errorf("%s: @props is (['content' => [], 'variant' => '%s'])", t.Name, s.Variants[0].Name))
	}
	c := &checker{used: map[*Field]bool{}, name: t.Name}
	env := map[string][]*Field{"content": s.Fields}
	c.nodes(t.body, env, s)
	errs = append(errs, c.errs...)
	var unused []string
	var walk func(fields []*Field, prefix string)
	walk = func(fields []*Field, prefix string) {
		for _, f := range fields {
			if !c.used[f] {
				unused = append(unused, prefix+f.Name)
			}
			walk(f.Item, prefix+f.Name+"[].")
		}
	}
	walk(s.Fields, "")
	sort.Strings(unused)
	for _, u := range unused {
		errs = append(errs, fmt.Errorf("%s: field %s isn't used by the template", t.Name, u))
	}
	return errors.Join(errs...)
}

type checker struct {
	name string
	used map[*Field]bool
	errs []error
}

func (c *checker) nodes(nodes []node, env map[string][]*Field, s *Schema) {
	for _, n := range nodes {
		switch x := n.(type) {
		case echoNode:
			c.expr(x.e, env, s)
		case classNode:
			for _, e := range x.entries {
				if e.cond != nil {
					c.expr(e.cond, env, s)
				}
			}
		case *ifNode:
			for _, b := range x.branches {
				c.expr(b.cond, env, s)
				c.nodes(b.body, env, s)
			}
			c.nodes(x.els, env, s)
		case *foreachNode:
			c.expr(x.list, env, s)
			inner := map[string][]*Field{}
			for k, v := range env {
				inner[k] = v
			}
			if f := c.field(x.list, env); f != nil {
				if f.Type != "list" {
					c.errs = append(c.errs, fmt.Errorf("%s: @foreach over %s, which is a %s field, not a list", c.name, x.list.php(), f.Type))
				}
				inner[x.val] = f.Item
			} else {
				delete(inner, x.val)
			}
			if x.key != "" {
				delete(inner, x.key)
			}
			c.nodes(x.body, inner, s)
		}
	}
}

// field resolves $content['a'] or $item['b'] to its schema field, marking it
// used; nil for anything else.
func (c *checker) field(e expr, env map[string][]*Field) *Field {
	ix, ok := e.(indexExpr)
	if !ok {
		return nil
	}
	v, ok := ix.base.(varExpr)
	if !ok {
		return nil
	}
	fields, ok := env[v.name]
	if !ok {
		return nil
	}
	lit, ok := ix.key.(litExpr)
	key, isStr := lit.v.(string)
	if !ok || !isStr {
		c.errs = append(c.errs, fmt.Errorf("%s: %s: read fields by name", c.name, e.php()))
		return nil
	}
	i := slices.IndexFunc(fields, func(f *Field) bool { return f.Name == key })
	if i < 0 {
		c.errs = append(c.errs, fmt.Errorf("%s: %s isn't a field in the schema", c.name, e.php()))
		return nil
	}
	c.used[fields[i]] = true
	return fields[i]
}

func (c *checker) expr(e expr, env map[string][]*Field, s *Schema) {
	switch x := e.(type) {
	case indexExpr:
		if f := c.field(x, env); f != nil {
			return
		}
		c.expr(x.base, env, s)
		c.expr(x.key, env, s)
	case notExpr:
		c.expr(x.x, env, s)
	case binExpr:
		c.expr(x.l, env, s)
		c.expr(x.r, env, s)
		// $variant === 'name' must name a real variant.
		for _, pair := range [][2]expr{{x.l, x.r}, {x.r, x.l}} {
			if v, ok := pair[0].(varExpr); ok && v.name == "variant" {
				if lit, ok := pair[1].(litExpr); ok {
					if name, ok := lit.v.(string); ok && !s.HasVariant(name) {
						c.errs = append(c.errs, fmt.Errorf("%s: %q isn't one of the schema's variants", c.name, name))
					}
				}
			}
		}
	case condExpr:
		c.expr(x.c, env, s)
		c.expr(x.t, env, s)
		c.expr(x.f, env, s)
	case callExpr:
		for _, a := range x.args {
			c.expr(a, env, s)
		}
	}
}
