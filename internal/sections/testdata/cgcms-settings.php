<?php
// kit_cgcms_block() inside a cg-cms app, against stand-ins for app(),
// config(), cg-cms's Settings and its CacheContext: the site's details come
// from cg-cms's settings over config('kit-blocks.site'), and a block bound to
// them tags the page settings:site. Run by cgcms_test.go as
// php cgcms-settings.php <out>; prints {"cta": ..., "stats": ..., "tags": [...]}.

namespace Cg\Cms\Settings {
    final class Settings
    {
        public const SITE_TAG = 'settings:site';

        public function site(): array
        {
            // As cg-cms stores them: empty where the owner left them empty.
            return ['name' => 'Settings Ltd', 'phone' => '01234 999999', 'email' => null, 'socials' => []];
        }
    }
}

namespace Cg\Cms\Cache {
    final class CacheContext
    {
        public array $tags = [];

        public function registerTag(string $tag): void
        {
            $this->tags[$tag] = true;
        }
    }
}

namespace {
    function app(?string $abstract = null): object
    {
        static $container;
        $container ??= new class {
            public array $instances = [];

            public function bound(string $abstract): bool
            {
                return true;
            }

            public function make(string $abstract): object
            {
                return $this->instances[$abstract] ??= new $abstract();
            }
        };
        return $abstract === null ? $container : $container->make($abstract);
    }

    function config(string $key, mixed $default = null): mixed
    {
        return [
            'kit-blocks.site' => ['name' => 'Config Co', 'phone' => '000', 'email' => 'hello@config.test'],
            'app.name' => 'App',
        ][$key] ?? $default;
    }

    set_error_handler(function ($no, $msg, $file, $line) { throw new ErrorException($msg, 0, $no, $file, $line); });
    [, $out] = $argv;
    require $out . '/kit/cgcms.php';
    $context = app(\Cg\Cms\Cache\CacheContext::class);
    $stats = kit_cgcms_block('stats', [])->toHtml();
    $untagged = array_keys($context->tags);
    $cta = kit_cgcms_block('cta', ['title' => 'Call us'])->toHtml();
    $site = kit_cgcms_site();
    echo json_encode([
        'stats_tags' => $untagged,
        'tags' => array_keys($context->tags),
        'cta' => $cta,
        'site' => ['name' => $site['name'] ?? null, 'phone' => $site['phone'] ?? null, 'email' => $site['email'] ?? null],
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}
