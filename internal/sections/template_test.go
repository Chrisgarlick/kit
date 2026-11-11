package sections

import (
	"fmt"
	"strings"
	"testing"
)

const props = "@props(['content' => [], 'variant' => 'default'])\n"

// corpus is a set of small templates with content, each rendered in Go,
// compiled PHP and Blade: whitespace around every directive, escaping, the
// helpers and PHP's truthiness.
var corpus = []struct {
	src     string
	content map[string]any
}{
	{"<p>{{ $content['a'] }}</p>\n<p>{{ $content['a'] }}\n</p>\n", map[string]any{"a": "x"}},
	{"{{ $content['a'] }}\n\n\nend", map[string]any{"a": "x"}},
	{"@if($content['a'])\nyes\n@else\nno\n@endif\nafter\n", map[string]any{"a": true}},
	{"@if($content['a'])\nyes\n@else\nno\n@endif\nafter\n", map[string]any{"a": "0"}},
	{"  @if($content['a']) inline @endif  \n@if(!$content['a'])x @endif", map[string]any{"a": []any{}}},
	{"@if($content['n'] === 1)\none\n@elseif($content['n'] === 2)\ntwo\n@else\nmany\n@endif", map[string]any{"n": float64(2)}},
	{"<ul>\n  @foreach($content['l'] as $i => $x)\n  <li>{{ $i }}: {{ $x['t'] }}</li>\n  @endforeach\n</ul>\n", map[string]any{"l": []any{map[string]any{"t": "a"}, map[string]any{"t": "b"}}}},
	{"@foreach($content['l'] as $x)@foreach($x['l'] as $y){{ $y }},@endforeach;@endforeach", map[string]any{"l": []any{map[string]any{"l": []any{"1", "2"}}, map[string]any{"l": []any{}}}}},
	{"@isset($content['m']['k'])\nset {{ $content['m']['k'] }}\n@endisset\n@isset($content['m']['z'])\nno\n@endisset\n", map[string]any{"m": map[string]any{"k": "v"}}},
	{"<a @class(['kit-a', 'kit-b' => $content['on'], 'kit-c' => !$content['on']])>x</a>\n", map[string]any{"on": true}},
	{"{{ $content['x'] }}|{{ $content['n'] }}|{{ $content['f'] }}|{{ $content['b'] }}|{{ $content['z'] }}", map[string]any{"x": `<script>alert("x")</script> & 'q'`, "n": float64(42), "f": 1.5, "b": true, "z": nil}},
	{"<a href=\"{{ kit_url($content['u']) }}\">{{ kit_url($content['v']) }} {{ kit_url($content['w']) }} {{ kit_url($content['y']) }}</a>", map[string]any{"u": "javascript:alert(1)", "v": " //evil.com", "w": "/ok?a=1&b=2", "y": "HTTPS://x.com/\"><b>"}},
	{"{{ kit_rich($content['r']) }}", map[string]any{"r": "**bold** and *em* <b>not</b> *unclosed\nline two\r\nthree **x*"}},
	{"{{ kit_tel($content['t']) }} {{ kit_tel($content['u']) }} {{ kit_mailto($content['m']) }} {{ kit_mailto($content['n']) }}", map[string]any{"t": "+44 (0)1234 567890", "u": "call us", "m": " hi@x.co.uk ", "n": "a@b\" onclick=\"x"}},
	{"{{ $content['a'] ?? 'dflt' }} {{ $content['missing'] ?? 'gone' }} {{ $content['a'] ? 'y' : 'n' }} {{ count($content['l']) }} {{ empty($content['l']) ? 'e' : 'f' }}", map[string]any{"a": nil, "l": []any{"1"}}},
	{"@@if literal, @{{ $x }} stays, mail me@example.com, {{-- gone --}}kept\n{{-- a\nmulti-line comment --}}\n<p>{{ $variant }}</p>", map[string]any{}},
	{"{{ $content['s'] }}", map[string]any{"s": "bad \xff byte é"}},
	{"<{{ kit_heading($content['a']) }}>|{{ kit_heading($content['b']) }}|{{ kit_heading($content['c']) }}|{{ kit_heading($content['d']) }}", map[string]any{"a": float64(3), "b": float64(9), "c": "1 onclick=x", "d": 2.5}},
	{"{{ kit_paragraphs($content['p']) }}|{{ kit_paragraphs($content['e']) }}", map[string]any{"p": "  One *two*\nline.\n\n\n  Three <b>\r\n \r\nFour  ", "e": "   "}},
}

func TestTemplatesMatchPHPAndBlade(t *testing.T) {
	var cases []phpCase
	var want, names []string
	for i, c := range corpus {
		name := fmt.Sprintf("corpus%d", i)
		src := props + c.src
		tpl, err := Parse(name, src)
		if err != nil {
			t.Fatalf("%s: %v", name, err)
		}
		p := map[string]any{"content": c.content, "variant": "default"}
		html, err := tpl.Render(p)
		if err != nil {
			t.Fatalf("%s: %v", name, err)
		}
		cases = append(cases, phpCase{name, src, tpl, p})
		want = append(want, html)
		names = append(names, name)
	}
	compareAll(t, cases, want, names)
}

func TestEscaping(t *testing.T) {
	tpl, err := Parse("t", props+`<a href="{{ kit_url($content['u']) }}" title="{{ $content['t'] }}">{{ kit_rich($content['r']) }}</a>`)
	if err != nil {
		t.Fatal(err)
	}
	out, err := tpl.Render(map[string]any{"content": map[string]any{
		"u": "javascript:alert(1)",
		"t": `" onmouseover="alert(1)`,
		"r": "<img src=x onerror=alert(1)> **<script>**",
	}})
	if err != nil {
		t.Fatal(err)
	}
	for _, bad := range []string{"javascript:", `" onmouseover`, "<img", "<script"} {
		if strings.Contains(out, bad) {
			t.Errorf("%q got through: %s", bad, out)
		}
	}
}

func TestParseRejects(t *testing.T) {
	for src, want := range map[string]string{
		"{!! $content['x'] !!}":                           "unescaped",
		"<?php echo 1; ?>":                                "<?php",
		"<x-kit-button />":                                "components",
		"@php echo 1; @endphp":                            "@php",
		"@include('x')":                                   "@include",
		"{{ $content['a'] == 1 }}":                        "===",
		"{{ strtoupper($content['a']) }}":                 "isn't allowed",
		"{{ $content['a'] ? 1 : $content['b'] ? 2 : 3 }}": "unexpected",
		"{{ \"$x\" }}":                                    "double-quoted",
		"@if($content['a'])\nx":                           "@endif",
		"x\n@endif":                                       "without its opening",
		"@foreach($content['l'])\n@endforeach":            "as $item",
		"<a @class(['Bad Name'])>":                        "plain class name",
		"<a @class([$content['c']])>":                     "plain class names",
		"@if($content['a']) @else @else @endif":           "two @else",
		"{{ $content['a'] = 1 }}":                         "unexpected",
	} {
		_, err := Parse("t", props+src)
		if err == nil || !strings.Contains(err.Error(), want) {
			t.Errorf("%q: got %v, want an error about %q", src, err, want)
		}
	}
	if _, err := Parse("t", "<p>x</p>\n"+props); err == nil {
		t.Error("@props after content: want an error")
	}
}
