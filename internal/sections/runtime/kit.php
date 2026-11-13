<?php
// kit's runtime for section templates: the helpers the compiled PHP (and the
// Blade source) call. Copied into a project by `kit section export`; don't edit
// it there. Every template helper has a twin in kit's Go renderer
// (internal/sections/value.go) that must behave identically, and a test
// renders each section both ways and compares the HTML. The content helpers
// at the end (kit_content and its parts) are what a CMS calls to turn stored
// content into a template's; content_test.go checks them.
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

    /** A heading level as its tag name, h1 to h4, and h2 for anything else. */
    function kit_heading(mixed $level): string
    {
        if ((is_int($level) || is_float($level)) && $level == (int) $level && $level >= 1 && $level <= 4) {
            return 'h' . (int) $level;
        }
        return 'h2';
    }

    /** Text with blank lines between paragraphs, as <p> elements of rich text. */
    function kit_paragraphs(mixed $value): KitSafe
    {
        $s = trim(str_replace("\r\n", "\n", (string) ($value ?? '')));
        if ($s === '') {
            return new KitSafe('');
        }
        $out = [];
        foreach (preg_split('/\n[ \t]*\n\s*/', $s) as $p) {
            $out[] = '<p>' . kit_rich($p)->toHtml() . '</p>';
        }
        return new KitSafe(implode("\n", $out));
    }

    /** One of kit's icons as inline SVG, hidden from screen readers; '' for an unknown name. */
    function kit_icon(mixed $name): KitSafe
    {
        // Written in by kit from its icon set (internal/sections/runtime/icons.json).
        static $icons = /* KIT_ICONS */ [];
        if (!is_string($name) || !isset($icons[$name])) {
            return new KitSafe('');
        }
        return new KitSafe('<svg class="kit-icon" aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' . $icons[$name] . '</svg>');
    }

    /** The first letters of a name's first two words, in capitals ("Jo Smith" is "JS"). */
    function kit_initials(mixed $name): string
    {
        $words = preg_split('/\s+/u', trim((string) ($name ?? '')), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $out = '';
        foreach (array_slice($words, 0, 2) as $w) {
            $out .= mb_strtoupper(mb_substr($w, 0, 1));
        }
        return $out;
    }

    /** A hex colour as it is, anything else 'transparent': safe in a style attribute. */
    function kit_colour(mixed $value): string
    {
        $s = trim((string) ($value ?? ''));
        return preg_match('/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/', $s) ? $s : 'transparent';
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

// Section content as a CMS stores it, made ready for a template. Each CMS
// (kit Blocks in WordPress, cg-cms) stores a section's content its own way;
// these turn it into exactly what the template expects, from the section's
// schema (<name>.schema.json, decoded to an array), so every CMS gives the
// template the same content and the HTML matches kit's own.
if (!function_exists('kit_content')) {
    /**
     * A section's content, ready to render: sanitised against the schema (see
     * kit_sanitise), its empty bound fields filled from the site's details
     * (kit_bind), then every field filled (kit_fill).
     *
     * $schema is the decoded schema.json; $data the content as stored (anything:
     * a non-array is no content); $site the site's details, from kit_site();
     * $resolveImage turns a stored image into {src, alt, width, height}, called
     * as fn(mixed $value, array $field): ?array, for a CMS that stores a
     * reference (cg-cms stores {id, alt}). Without it an image is used as stored.
     */
    function kit_content(array $schema, mixed $data, array $site = [], ?callable $resolveImage = null): array
    {
        $fields = $schema['fields'] ?? [];
        $content = kit_sanitise($fields, $data, $resolveImage);
        $content = kit_bind($fields, $content, $site);
        return kit_fill($fields, $content);
    }

    /** One of the schema's variants: $variant if it is one, the first (the default) if not. */
    function kit_variant(array $schema, mixed $variant): string
    {
        $variants = array_map('strval', array_keys($schema['variants'] ?? ['default' => '']));
        return is_string($variant) && in_array($variant, $variants, true) ? $variant : $variants[0];
    }

    /**
     * The site's details as stored, sanitised against the site settings
     * schema (settings/site.schema.json): what kit_content() takes as $site.
     */
    function kit_site(array $siteSchema, mixed $data, ?callable $resolveImage = null): array
    {
        return kit_sanitise($siteSchema['fields'] ?? [], $data, $resolveImage);
    }

    /**
     * Content made safe for the template: fields the schema doesn't have are
     * dropped, values of the wrong type are dropped (so they fall back to
     * their defaults), values are cast to their field's type (a number or
     * heading level typed as a string, a boolean as 1 or "0"), text is cut to
     * its maximum, lists to their maximum items, and addresses kit wouldn't
     * link to are emptied. The template escapes everything as well; this
     * keeps it from failing on content an old version or a hand edit left.
     */
    function kit_sanitise(array $fields, mixed $content, ?callable $resolveImage = null): array
    {
        if (!is_array($content)) {
            return [];
        }
        $out = [];
        foreach ($fields as $name => $field) {
            if (!array_key_exists($name, $content)) {
                continue;
            }
            $v = kit_sanitise_value($field, $content[$name], $resolveImage);
            if ($v !== null) {
                $out[$name] = $v;
            }
        }
        return $out;
    }

    /** One value cast to its field's type, or null when it can't be used. */
    function kit_sanitise_value(array $field, mixed $v, ?callable $resolveImage = null): mixed
    {
        $max = $field['max'] ?? 0;
        switch ($field['type']) {
            case 'text':
            case 'textarea':
            case 'rich-text':
            case 'url':
                if (!is_string($v) && !is_int($v) && !is_float($v)) {
                    return null;
                }
                $s = str_replace("\r\n", "\n", (string) $v);
                if ($field['type'] === 'text' || $field['type'] === 'url') {
                    $s = str_replace(["\n", "\r"], ' ', $s);
                }
                if ($max > 0 && mb_strlen($s) > $max) {
                    $s = mb_substr($s, 0, $max);
                }
                if ($field['type'] === 'url' && $s !== '' && $s !== '#' && kit_url($s) === '#') {
                    return '';
                }
                return $s;
            case 'number':
                return is_int($v) || is_float($v) ? $v : (is_string($v) && is_numeric($v) ? $v + 0 : null);
            case 'boolean':
                if (is_bool($v)) {
                    return $v;
                }
                // A form's checkbox or select: 1 and 0, "1", "0", "true", "false".
                if ($v === 1 || $v === 0) {
                    return $v === 1;
                }
                return match ($v) { '1', 'true' => true, '0', 'false' => false, default => null };
            case 'enum':
                return is_string($v) && in_array($v, $field['options'], true) ? $v : null;
            case 'icon':
                return is_string($v) && kit_icon($v)->toHtml() !== '' ? $v : null;
            case 'heading-level':
                $n = is_numeric($v) ? (int) $v : 0;
                return $n >= 1 && $n <= 4 ? $n : null;
            case 'image':
                if ($resolveImage !== null && $v !== null) {
                    $v = $resolveImage($v, $field);
                }
                if (!is_array($v) || !is_string($v['src'] ?? null) || $v['src'] === '' || kit_url($v['src']) === '#') {
                    return null;
                }
                $img = ['src' => $v['src'], 'alt' => is_string($v['alt'] ?? null) ? $v['alt'] : ''];
                foreach (['width', 'height'] as $k) {
                    if (isset($v[$k]) && is_numeric($v[$k]) && $v[$k] > 0) {
                        $img[$k] = (int) $v[$k];
                    }
                }
                return $img;
            case 'list':
                if (!is_array($v) || !array_is_list($v)) {
                    return null;
                }
                $items = [];
                foreach ($v as $item) {
                    if (is_array($item)) {
                        $items[] = kit_sanitise($field['item'], $item, $resolveImage);
                    }
                }
                return $max > 0 ? array_slice($items, 0, $max) : $items;
        }
        return null;
    }

    /**
     * Content with its empty bound fields ("bind": "site.phone") filled from
     * the site's details. A value the content sets itself always wins.
     */
    function kit_bind(array $fields, array $content, array $site): array
    {
        foreach ($fields as $name => $field) {
            $key = isset($field['bind']) && str_starts_with($field['bind'], 'site.') ? substr($field['bind'], 5) : null;
            if ($key === null) {
                continue;
            }
            $have = $content[$name] ?? null;
            if (($have === null || $have === '' || $have === []) && isset($site[$key]) && $site[$key] !== '' && $site[$key] !== []) {
                $content[$name] = $site[$key];
            }
        }
        return $content;
    }

    /**
     * Every field present, missing ones at their defaults (kit_zero), list
     * items filled too, so a template reads any field without isset. The twin
     * of kit's Go Schema.Fill (internal/sections/schema.go).
     */
    function kit_fill(array $fields, array $content): array
    {
        $out = [];
        foreach ($fields as $name => $field) {
            $v = $content[$name] ?? null;
            if ($v === null) {
                $out[$name] = kit_zero($field);
                continue;
            }
            if ($field['type'] === 'list' && is_array($v)) {
                $v = array_map(fn ($item) => is_array($item) ? kit_fill($field['item'], $item) : $item, $v);
            }
            $out[$name] = $v;
        }
        return $out;
    }

    /** A field's value when the content leaves it out: its default, or its type's empty value. */
    function kit_zero(array $field): mixed
    {
        if (array_key_exists('default', $field) && $field['default'] !== null) {
            return $field['default'];
        }
        return match ($field['type']) {
            'text', 'textarea', 'rich-text', 'url', 'icon' => '',
            'boolean' => false,
            'enum' => $field['options'][0],
            'heading-level' => 2,
            'list' => [],
            default => null, // number, image
        };
    }
}
