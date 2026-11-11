<?php
// kit's runtime for section templates: the helpers the compiled PHP (and the
// Blade source) call. Copied into a project by `kit section export`; don't edit
// it there. Every function has a twin in kit's Go renderer
// (internal/sections/value.go) that must behave identically, and a test
// renders each section both ways and compares the HTML.
//
// Needs PHP 8.1 or later. Safe to include twice.

if (!function_exists('kit_e')) {
    if (interface_exists(\Illuminate\Contracts\Support\Htmlable::class)) {
        /** Markup kit built itself (rich text). Blade's e() doesn't escape it again. */
        final class KitSafe implements \Illuminate\Contracts\Support\Htmlable
        {
            public function __construct(private string $html) {}
            public function toHtml(): string { return $this->html; }
            public function __toString(): string { return $this->html; }
        }
    } else {
        /** Markup kit built itself (rich text). kit_e() doesn't escape it again. */
        final class KitSafe
        {
            public function __construct(private string $html) {}
            public function toHtml(): string { return $this->html; }
            public function __toString(): string { return $this->html; }
        }
    }

    /** Escaped text for HTML, as Blade's {{ }}: htmlspecialchars with ENT_QUOTES and ENT_SUBSTITUTE. */
    function kit_e(mixed $value): string
    {
        if ($value instanceof KitSafe) {
            return $value->toHtml();
        }
        if (interface_exists(\Illuminate\Contracts\Support\Htmlable::class) && $value instanceof \Illuminate\Contracts\Support\Htmlable) {
            return $value->toHtml();
        }
        return htmlspecialchars($value ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    /**
     * A link or image address that's safe to print: http, https, mailto and tel
     * addresses, and addresses on the site (/path, #id, ?query). Anything else
     * (javascript:, data:, //other-host) becomes "#". Still needs kit_e().
     */
    function kit_url(mixed $value): string
    {
        $s = trim((string) ($value ?? ''));
        if ($s === '') {
            return '';
        }
        if (preg_match('/^(https?:|mailto:|tel:)/i', $s)) {
            return $s;
        }
        if (str_starts_with($s, '//')) {
            return '#';
        }
        if (str_starts_with($s, '/') || str_starts_with($s, '#') || str_starts_with($s, '?')) {
            return $s;
        }
        return '#';
    }

    /** A phone number as written, as a tel: link: digits only, keeping a leading +. */
    function kit_tel(mixed $value): string
    {
        $s = trim((string) ($value ?? ''));
        $digits = preg_replace('/[^0-9]/', '', $s);
        if ($digits === '') {
            return '';
        }
        return 'tel:' . (str_starts_with($s, '+') ? '+' : '') . $digits;
    }

    /** An email address as a mailto: link, or '' when it isn't one (no @, or spaces in it). */
    function kit_mailto(mixed $value): string
    {
        $s = trim((string) ($value ?? ''));
        $at = strpos($s, '@');
        if ($at === false || $at < 1 || $at === strlen($s) - 1 || strpbrk($s, " \t\n\r<>\"'?") !== false) {
            return '';
        }
        return 'mailto:' . $s;
    }

    /**
     * Rich text: plain text with *emphasis*, **strong** and line breaks. It's
     * escaped first and the marks become tags after, so it can't carry markup.
     */
    function kit_rich(mixed $value): KitSafe
    {
        $s = str_replace("\r\n", "\n", (string) ($value ?? ''));
        $s = htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $s = preg_replace('/\*\*([^*\n]+)\*\*/', '<strong>$1</strong>', $s);
        $s = preg_replace('/\*([^*\n]+)\*/', '<em>$1</em>', $s);
        $s = str_replace("\n", "<br>\n", $s);
        return new KitSafe($s);
    }

    /** @class([...]): the always-on names, and the keyed ones whose condition is true. */
    function kit_classes(array $classes): string
    {
        $out = [];
        foreach ($classes as $key => $value) {
            if (is_int($key)) {
                $out[] = $value;
            } elseif ($value) {
                $out[] = $key;
            }
        }
        return implode(' ', $out);
    }

    /**
     * Renders a compiled section (the .php file kit writes) and returns its
     * HTML, left-trimmed as Blade's is: kit_section(__DIR__.'/kit/hero.php', ['content' => $content, 'variant' => 'centred']).
     */
    function kit_section(string $file, array $props = []): string
    {
        static $templates = [];
        $templates[$file] ??= require $file;
        ob_start();
        try {
            ($templates[$file])(...$props);
        } catch (\Throwable $e) {
            ob_end_clean();
            throw $e;
        }
        return ltrim(ob_get_clean()); // as Blade does a view's output
    }
}
