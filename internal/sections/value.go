package sections

import (
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"
)

// Values in a template are what content decoded from JSON holds: nil, bool,
// float64, string, []any and map[string]any, plus Safe for markup kit has
// already escaped. Every helper here has a twin in runtime/kit.php that must
// behave identically: the parity test renders each section both ways.

// Safe is HTML kit built itself (rich text, class lists). Echoing it doesn't
// escape it again, as Blade doesn't escape an Htmlable.
type Safe string

// truthy is PHP's truthiness: false, null, 0, 0.0, "", "0" and [] are false.
func truthy(v any) bool {
	switch x := v.(type) {
	case nil:
		return false
	case bool:
		return x
	case float64:
		return x != 0
	case string:
		return x != "" && x != "0"
	case Safe:
		return x != "" && x != "0"
	case []any:
		return len(x) > 0
	case map[string]any:
		return len(x) > 0
	}
	return true
}

// str is how PHP turns a scalar into a string for echo.
func str(v any) (string, error) {
	switch x := v.(type) {
	case nil:
		return "", nil
	case bool:
		if x {
			return "1", nil
		}
		return "", nil
	case float64:
		if x == math.Trunc(x) && math.Abs(x) < 1e15 {
			return strconv.FormatInt(int64(x), 10), nil
		}
		return strconv.FormatFloat(x, 'f', -1, 64), nil
	case string:
		return x, nil
	case Safe:
		return string(x), nil
	}
	return "", fmt.Errorf("can't print a %s", kind(v))
}

func kind(v any) string {
	switch v.(type) {
	case nil:
		return "null"
	case bool:
		return "boolean"
	case float64:
		return "number"
	case string, Safe:
		return "string"
	case []any:
		return "list"
	case map[string]any:
		return "object"
	}
	return fmt.Sprintf("%T", v)
}

// escape is htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'): what
// Blade's e() and kit_e() do.
func escape(s string) string {
	var b strings.Builder
	for i := 0; i < len(s); {
		r, size := utf8.DecodeRuneInString(s[i:])
		i += size
		switch r {
		case '&':
			b.WriteString("&amp;")
		case '<':
			b.WriteString("&lt;")
		case '>':
			b.WriteString("&gt;")
		case '"':
			b.WriteString("&quot;")
		case '\'':
			b.WriteString("&#039;")
		default:
			// An invalid byte becomes U+FFFD, as with ENT_SUBSTITUTE.
			b.WriteRune(r)
		}
	}
	return b.String()
}

// echo is {{ x }}: escaped, unless kit built it.
func echo(v any) (string, error) {
	if s, ok := v.(Safe); ok {
		return string(s), nil
	}
	s, err := str(v)
	if err != nil {
		return "", err
	}
	return escape(s), nil
}

var urlOK = regexp.MustCompile(`(?i)^(https?:|mailto:|tel:)`)

// safeURL is kit_url(): http, https, mailto and tel addresses, and links
// within the site (/path, #id, ?query). Anything else (javascript:, data:,
// protocol-relative //host) becomes "#".
func safeURL(v any) (string, error) {
	s, err := str(v)
	if err != nil {
		return "", err
	}
	s = strings.Trim(s, " \t\n\r\x00\x0B") // PHP's trim()
	switch {
	case s == "":
		return "", nil
	case urlOK.MatchString(s):
		return s, nil
	case strings.HasPrefix(s, "//"):
		return "#", nil
	case strings.HasPrefix(s, "/"), strings.HasPrefix(s, "#"), strings.HasPrefix(s, "?"):
		return s, nil
	}
	return "#", nil
}

// tel is kit_tel(): a phone number as written ("01234 567890", "+44 1234
// 567890") as a tel: link, digits only, keeping a leading +.
func tel(v any) (string, error) {
	s, err := str(v)
	if err != nil {
		return "", err
	}
	s = strings.Trim(s, " \t\n\r\x00\x0B")
	var d strings.Builder
	for _, c := range s {
		if c >= '0' && c <= '9' {
			d.WriteRune(c)
		}
	}
	if d.Len() == 0 {
		return "", nil
	}
	if strings.HasPrefix(s, "+") {
		return "tel:+" + d.String(), nil
	}
	return "tel:" + d.String(), nil
}

// mailto is kit_mailto(): an email address as a mailto: link, or "" when it
// isn't one (no @, or spaces in it).
func mailto(v any) (string, error) {
	s, err := str(v)
	if err != nil {
		return "", err
	}
	s = strings.Trim(s, " \t\n\r\x00\x0B")
	at := strings.Index(s, "@")
	if at < 1 || at == len(s)-1 || strings.ContainsAny(s, " \t\n\r<>\"'?") {
		return "", nil
	}
	return "mailto:" + s, nil
}

var (
	strongRe = regexp.MustCompile(`\*\*([^*\n]+)\*\*`)
	emRe     = regexp.MustCompile(`\*([^*\n]+)\*`)
)

// rich is kit_rich(): rich text is stored as plain text with *emphasis*,
// **strong** and line breaks, never as HTML. It's escaped first, then the
// marks become tags, so nothing in it can be markup.
func rich(v any) (Safe, error) {
	s, err := str(v)
	if err != nil {
		return "", err
	}
	s = strings.ReplaceAll(s, "\r\n", "\n")
	s = escape(s)
	s = strongRe.ReplaceAllString(s, "<strong>$1</strong>")
	s = emRe.ReplaceAllString(s, "<em>$1</em>")
	s = strings.ReplaceAll(s, "\n", "<br>\n")
	return Safe(s), nil
}

// classes is @class([...]): Laravel's Arr::toCssClasses. Entries without a key
// are always in; keyed ones are in when their condition is truthy.
type classEntry struct {
	name string
	cond expr // nil: always
}

func classList(entries []classEntry, env *scope) (string, error) {
	var out []string
	for _, e := range entries {
		if e.cond == nil {
			out = append(out, e.name)
			continue
		}
		v, err := e.cond.eval(env)
		if err != nil {
			return "", err
		}
		if truthy(v) {
			out = append(out, e.name)
		}
	}
	return strings.Join(out, " "), nil
}

// identical is ===.
func identical(a, b any) bool {
	switch x := a.(type) {
	case Safe:
		a = string(x)
	}
	switch x := b.(type) {
	case Safe:
		b = string(x)
	}
	switch x := a.(type) {
	case nil, bool, float64, string:
		return a == b
	case []any:
		y, ok := b.([]any)
		if !ok || len(x) != len(y) {
			return false
		}
		for i := range x {
			if !identical(x[i], y[i]) {
				return false
			}
		}
		return true
	case map[string]any:
		y, ok := b.(map[string]any)
		if !ok || len(x) != len(y) {
			return false
		}
		for k, v := range x {
			if !identical(v, y[k]) {
				return false
			}
		}
		return true
	}
	return false
}

// count is PHP's count() on a list or object. Like PHP 8, it fails on null.
func count(v any) (float64, error) {
	switch x := v.(type) {
	case []any:
		return float64(len(x)), nil
	case map[string]any:
		return float64(len(x)), nil
	}
	return 0, fmt.Errorf("count() needs a list, not a %s", kind(v))
}
