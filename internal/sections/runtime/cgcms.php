<?php
// kit's sections as cg-cms blocks: what the generated block views call.
// Written by `kit build-cgcms` into <out>/kit/cgcms.php; don't edit it there.
//
// Each kit block's view (<out>/views/<name>.blade.php) pushes the section's
// CSS once and prints {{ kit_cgcms_block('<name>', $data) }}: the block's stored data becomes the
// section's content through kit_content() (kit.php), with the variant the
// block chose, and the section's compiled template renders it. kit-blocks.php
// registers the views' namespace, kit-blocks::, with Laravel each time it's
// loaded (kit_cgcms_register_views()).
//
// The site's details (settings/site.schema.json's fields), which bound fields
// show when a block leaves them empty, come from cg-cms's settings
// (Settings::site(), edited under Settings > Site details once the app points
// cg-cms.site_schema at kit/site.schema.json), over config('kit-blocks.site')
// for anything not set there. A block that shows them tags the page
// settings:site, so saving the settings purges it from cg-cms's page cache.
//
// Settings, read from Laravel's config when there is one:
//   kit-blocks.site  site details, under cg-cms's (or alone, without cg-cms)
//   kit-blocks.url   where <out>'s CSS is served (default /kit-blocks): each
//                    view pushes its section's style.css onto the kit-styles stack

require_once __DIR__ . '/kit.php';

if (!function_exists('kit_cgcms_block')) {
    define('KIT_CGCMS_DIR', dirname(__DIR__));

    /**
     * A kit block's HTML from the data cg-cms stores for it: its fields, and
     * the layout in `variant`. $site overrides the site's details.
     */
    function kit_cgcms_block(string $name, array $data, ?array $site = null): KitSafe
    {
        $schema = kit_cgcms_schema($name);
        if ($name === 'header' && isset($data['links']) && is_array($data['links'])) {
            // The current page is worked out: the link whose address is the
            // page being shown, as well as one the block marks itself.
            foreach ($data['links'] as $i => $link) {
                if (is_array($link)) {
                    $data['links'][$i]['current'] = kit_sanitise_value(['type' => 'boolean'], $link['current'] ?? null) === true
                        || kit_cgcms_is_current(is_string($link['url'] ?? null) ? $link['url'] : '');
                }
            }
        }
        if ($site === null && kit_cgcms_binds($schema['fields'] ?? [])) {
            kit_cgcms_depends_on_site();
        }
        $content = kit_content($schema, $data, $site ?? kit_cgcms_site(), kit_cgcms_images());
        $html = kit_section(KIT_CGCMS_DIR . "/sections/$name/$name.php", ['content' => $content, 'variant' => kit_variant($schema, $data['variant'] ?? null)]);
        return new KitSafe($html);
    }

    /** A section's schema, decoded once per request. */
    function kit_cgcms_schema(string $name): array
    {
        static $schemas = [];
        if (!preg_match('/^[a-z][a-z0-9-]*$/', $name) || !is_file(KIT_CGCMS_DIR . "/sections/$name/schema.json")) {
            throw new InvalidArgumentException("kit has no section called $name");
        }
        return $schemas[$name] ??= json_decode(file_get_contents(KIT_CGCMS_DIR . "/sections/$name/schema.json"), true, 64, JSON_THROW_ON_ERROR);
    }

    /** Whether any of a schema's fields (a list's items too) is bound to a site detail. */
    function kit_cgcms_binds(array $fields): bool
    {
        foreach ($fields as $field) {
            if (!empty($field['bind']) || (isset($field['item']) && is_array($field['item']) && kit_cgcms_binds($field['item']))) {
                return true;
            }
        }
        return false;
    }

    /**
     * Tags the page being rendered with cg-cms's settings:site, so saving the
     * site's details purges it from the page cache. Nothing without cg-cms.
     */
    function kit_cgcms_depends_on_site(): void
    {
        if (!function_exists('app') || !class_exists(\Cg\Cms\Cache\CacheContext::class) || !app()->bound(\Cg\Cms\Cache\CacheContext::class)) {
            return;
        }
        $tag = defined('Cg\Cms\Settings\Settings::SITE_TAG') ? \Cg\Cms\Settings\Settings::SITE_TAG : 'settings:site';
        app(\Cg\Cms\Cache\CacheContext::class)->registerTag($tag);
    }

    /**
     * The site's details, sanitised: cg-cms's settings (Settings::site()) over
     * config('kit-blocks.site'), a detail left empty in the settings showing
     * the config's; the name falls back to the app's.
     */
    function kit_cgcms_site(): array
    {
        if (!function_exists('config')) {
            return [];
        }
        $values = (array) config('kit-blocks.site', []);
        if (function_exists('app') && method_exists(\Cg\Cms\Settings\Settings::class, 'site')) {
            foreach ((array) app(\Cg\Cms\Settings\Settings::class)->site() as $key => $value) {
                if ($value !== null && $value !== '' && $value !== []) {
                    $values[$key] = $value;
                }
            }
        }
        $schema = json_decode(file_get_contents(KIT_CGCMS_DIR . '/kit/site.schema.json'), true, 64, JSON_THROW_ON_ERROR);
        $site = kit_site($schema, $values, kit_cgcms_images());
        if (($site['name'] ?? '') === '') {
            $site['name'] = (string) config('app.name', '');
        }
        return $site;
    }

    /**
     * cg-cms's images: a media field stores {id, alt}, resolved through its
     * MediaResolver at the preset the schema's sizes names (an unknown preset
     * is full size). An image with a src and no id is used as it is.
     */
    function kit_cgcms_images(): ?callable
    {
        if (!function_exists('app') || !class_exists(\Cg\Cms\Media\MediaResolver::class)) {
            return null;
        }
        return function (mixed $value, array $field): mixed {
            if (\Cg\Cms\Media\MediaResolver::reference($value) === null) {
                return $value;
            }
            $img = app(\Cg\Cms\Media\MediaResolver::class)->resolve($value, $field['sizes'] ?? 'full');
            if ($img === null) {
                return null;
            }
            return array_filter(['src' => $img->src, 'alt' => $img->alt, 'width' => $img->width, 'height' => $img->height], fn ($v) => $v !== null);
        };
    }

    /** Whether a link's address is the page being shown (its path, ignoring a trailing slash). */
    function kit_cgcms_is_current(string $url): bool
    {
        if ($url === '' || str_starts_with($url, '#') || !function_exists('request')) {
            return false;
        }
        $link = parse_url($url);
        if ($link === false || (!empty($link['host']) && $link['host'] !== request()->getHost())) {
            return false;
        }
        return trim($link['path'] ?? '', '/') === trim(request()->path(), '/');
    }

    /** The address of one of kit's stylesheets: kit/kit.css or sections/<name>/style.css. */
    function kit_cgcms_asset(string $path): string
    {
        $base = function_exists('config') ? (string) config('kit-blocks.url', '/kit-blocks') : '/kit-blocks';
        return rtrim($base, '/') . '/' . $path;
    }

    /**
     * Registers the block views, as kit-blocks::<name>, with the current
     * Laravel app. kit-blocks.php calls it each time it's loaded, not once per
     * process: a long-running process (a queue worker, Octane, a test suite)
     * boots a new app whose view factory needs the namespace again.
     */
    function kit_cgcms_register_views(): void
    {
        if (!function_exists('app') || !class_exists(\Illuminate\Container\Container::class)) {
            return;
        }
        $register = fn ($view) => $view->addNamespace('kit-blocks', KIT_CGCMS_DIR . '/views');
        app()->resolved('view') ? $register(app('view')) : app()->afterResolving('view', $register);
    }
}
