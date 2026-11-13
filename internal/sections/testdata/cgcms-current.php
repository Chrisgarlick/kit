<?php
// kit_cgcms_block() marks the header's current link from the request, against
// a stand-in for Laravel's request(): the link whose path is the page's is
// the page (aria-current="page"), one the page is under is its section
// (aria-current="true"). Run by cgcms_test.go as
// php cgcms-current.php <out> <path>...; prints {"<path>": {"<label>": "page|true|"}}.

namespace {
    function request(): object
    {
        return new class {
            public function path(): string
            {
                return $GLOBALS['kit_test_path'];
            }

            public function getHost(): string
            {
                return 'example.test';
            }
        };
    }

    set_error_handler(function ($no, $msg, $file, $line) { throw new ErrorException($msg, 0, $no, $file, $line); });
    $out = $argv[1];
    require $out . '/kit/cgcms.php';
    $links = [ // seven: the most a header has
        ['label' => 'Home', 'url' => '/'],
        ['label' => 'Services', 'url' => '/services'],
        ['label' => 'Laravel', 'url' => '/services/laravel/'],
        ['label' => 'Services extra', 'url' => '/services-extra'],
        ['label' => 'Elsewhere', 'url' => 'https://other.test/services'],
        ['label' => 'Marked', 'url' => '/marked', 'section' => true],
        ['label' => 'Stored', 'url' => '/stored', 'current' => true],
    ];
    $result = [];
    foreach (array_slice($argv, 2) as $path) {
        $GLOBALS['kit_test_path'] = $path;
        $html = kit_cgcms_block('header', ['brand_name' => 'Test', 'links' => $links])->toHtml();
        // The main nav only: the menu repeats it.
        $nav = substr($html, strpos($html, '<nav class="kit-header-nav"'));
        $nav = substr($nav, 0, strpos($nav, '</nav>'));
        foreach ($links as $link) {
            $marked = preg_match('/<a [^>]*aria-current="([a-z]+)"[^>]*>' . preg_quote($link['label'], '/') . '</', $nav, $m);
            $result[$path][$link['label']] = $marked ? $m[1] : '';
        }
    }
    echo json_encode($result, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}
