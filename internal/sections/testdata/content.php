<?php
// kit_content() and its parts (runtime/kit.php): casting, filling, binding,
// unsafe values and image resolution. Run by content_test.go as
// php content.php <kit.php> <sections dir> <demos.json>; prints JSON:
// {"checks": [[name, ok, detail]...], "demos": [content...]}.

set_error_handler(function ($no, $msg, $file, $line) { throw new ErrorException($msg, 0, $no, $file, $line); });
[, $runtime, $dir, $demosFile] = $argv;
require $runtime;
require $runtime; // safe to include twice

$schema = fn (string $name) => json_decode(file_get_contents("$dir/$name/$name.schema.json"), true, 64, JSON_THROW_ON_ERROR);
$checks = [];
$check = function (string $name, bool $ok, mixed $detail = null) use (&$checks) {
    $checks[] = [$name, $ok, $ok ? '' : json_encode($detail, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)];
};

// Casting: values typed as strings (a CMS's select, a form) take their field's type.
$fields = [
    'n' => ['type' => 'number'],
    'h' => ['type' => 'heading-level', 'default' => 2],
    'b1' => ['type' => 'boolean'], 'b2' => ['type' => 'boolean'], 'b3' => ['type' => 'boolean'], 'b4' => ['type' => 'boolean'], 'b5' => ['type' => 'boolean'],
    't' => ['type' => 'text', 'max' => 5],
    'ta' => ['type' => 'textarea'],
    'e' => ['type' => 'enum', 'options' => ['a', 'b'], 'default' => 'b'],
    'e2' => ['type' => 'enum', 'options' => ['a', 'b']],
    'i' => ['type' => 'icon'],
];
$c = kit_content(['fields' => $fields], ['n' => '42', 'h' => '1', 'b1' => '1', 'b2' => 'false', 'b3' => 0, 'b4' => 'yes', 'b5' => true, 't' => "ab\ncdefgh", 'ta' => "a\r\nb", 'e' => 'z', 'e2' => 'b', 'i' => 'nope']);
$check('a number typed as a string is a number', $c['n'] === 42, $c['n']);
$check('a heading level typed as a string is an int', $c['h'] === 1 && kit_heading($c['h']) === 'h1', $c['h']);
$check('booleans from forms', $c['b1'] === true && $c['b2'] === false && $c['b3'] === false && $c['b5'] === true, $c);
$check('a boolean that is not one is false', $c['b4'] === false, $c['b4']);
$check('text is one line, cut to its maximum', $c['t'] === 'ab cd', $c['t']);
$check('a textarea keeps its lines, CRLF to LF', $c['ta'] === "a\nb", $c['ta']);
$check('an enum outside its options takes its default', $c['e'] === 'b' && $c['e2'] === 'b', $c);
$check('an unknown icon is empty', $c['i'] === '', $c['i']);
$c = kit_content(['fields' => $fields], ['h' => 7, 'n' => 'many']);
$check('a heading level out of range takes its default', $c['h'] === 2, $c['h']);
$check('a number that is not one is null', $c['n'] === null, $c['n']);

// Filling: every field, at its default or its type's empty value, in list items too.
$hero = $schema('hero');
$c = kit_content($hero, ['actions' => [['label' => 'Go', 'url' => '/go']]]);
$check('every field is present', array_keys($c) === array_keys($hero['fields']), array_keys($c));
$check('missing fields take their defaults', $c['title'] === '' && $c['title_size'] === 'normal' && $c['heading_level'] === 1 && $c['image'] === null && $c['eyebrow_icon'] === '', $c);
$check('list items are filled', $c['actions'][0] === ['label' => 'Go', 'url' => '/go', 'style' => 'primary'], $c['actions']);
$check('content that is not an object is no content', kit_content($hero, 'nonsense') === kit_content($hero, []));
$check('unknown fields are dropped', !array_key_exists('extra', kit_content($hero, ['extra' => 1])));

// Unsafe and oversized values.
$c = kit_content($hero, [
    'title' => '<script>alert(1)</script>',
    'eyebrow' => ['not', 'text'],
    'actions' => [['label' => 'A', 'url' => 'javascript:alert(1)'], ['label' => 'B', 'url' => '//evil.example'], ['label' => 'C', 'url' => '/c']],
    'image' => ['src' => 'data:image/png;base64,xx', 'alt' => 'x'],
]);
$check('markup in text stays text for the template to escape', $c['title'] === '<script>alert(1)</script>' && !str_contains(kit_rich($c['title'])->toHtml(), '<script'), $c['title']);
$check('a value of the wrong type falls back', $c['eyebrow'] === '', $c['eyebrow']);
$check('addresses kit won’t link to are emptied', $c['actions'][0]['url'] === '' && $c['actions'][1]['url'] === '', $c['actions']);
$check('a list is cut to its maximum', count($c['actions']) === 2, $c['actions']);
$check('a data: image is dropped', $c['image'] === null, $c['image']);
$c = kit_content($hero, ['actions' => ['a' => ['label' => 'x']], 'image' => ['src' => '/a.jpg', 'alt' => 5, 'width' => '800', 'height' => -1, 'onload' => 'x']]);
$check('a list must be a list', $c['actions'] === [], $c['actions']);
$check('an image keeps src, alt, and positive sizes', $c['image'] === ['src' => '/a.jpg', 'alt' => '', 'width' => 800], $c['image']);

// Binding: an empty bound field shows the site's value; the content's own wins.
$footer = $schema('footer');
$siteSchema = json_decode(file_get_contents("$dir/../settings/site.schema.json"), true);
$site = kit_site($siteSchema, ['name' => 'Acme Ltd', 'phone' => '0113 496 0000', 'socials' => [['network' => 'facebook', 'url' => 'https://facebook.com/acme'], ['url' => 'javascript:x']], 'unknown' => 'x']);
$check('site details are sanitised', !isset($site['unknown']) && $site['socials'][1]['url'] === '', $site);
$c = kit_content($footer, ['phone' => '', 'email' => 'own@acme.co.uk'], $site);
$check('an empty bound field shows the site’s value', $c['phone'] === '0113 496 0000' && $c['brand_name'] === 'Acme Ltd' && count($c['social']) === 2, $c);
$check('a value the content sets wins', $c['email'] === 'own@acme.co.uk', $c['email']);
$check('a bound field the site leaves empty is at its default', $c['blurb'] === '' && $c['logo'] === null, $c);
$check('bound list items are filled', $c['social'][1]['network'] === 'instagram', $c['social']);
$c = kit_content($footer, ['phone' => '07700 900000'], $site);
$check('the content’s own phone isn’t replaced', $c['phone'] === '07700 900000', $c['phone']);

// Images through a resolver: a CMS that stores {id, alt}.
$seen = [];
$resolve = function ($v, array $field) use (&$seen) {
    $seen[] = $field['sizes'] ?? '';
    if (!is_array($v) || ($v['id'] ?? '') !== 'abc') {
        return null;
    }
    return ['src' => '/media/abc-' . ($field['sizes'] ?? 'full') . '.jpg', 'alt' => $v['alt'] ?? '', 'width' => 1200, 'height' => 800];
};
$c = kit_content($hero, ['image' => ['id' => 'abc', 'alt' => 'A kitchen']], [], $resolve);
$check('the resolver turns a reference into an image', $c['image'] === ['src' => '/media/abc-hero.jpg', 'alt' => 'A kitchen', 'width' => 1200, 'height' => 800], $c['image']);
$check('the resolver is told the field, with its sizes', $seen === ['hero'], $seen);
$c = kit_content($hero, ['image' => ['id' => 'gone']], [], $resolve);
$check('an image the resolver can’t find is empty', $c['image'] === null, $c['image']);
$evil = fn ($v) => ['src' => 'javascript:alert(1)', 'alt' => 'x'];
$check('a resolved image is still checked', kit_content($hero, ['image' => ['id' => 'x']], [], $evil)['image'] === null);
$gallery = $schema('gallery');
$listImage = null;
foreach ($gallery['fields'] as $name => $f) {
    if ($f['type'] === 'list') {
        foreach ($f['item'] as $iname => $if) {
            if ($if['type'] === 'image') {
                $listImage = [$name, $iname];
            }
        }
    }
}
if ($listImage !== null) {
    [$l, $i] = $listImage;
    $c = kit_content($gallery, [$l => [[$i => ['id' => 'abc', 'alt' => 'One']]]], [], $resolve);
    $check('images in list items are resolved', ($c[$l][0][$i]['src'] ?? '') !== '' && $c[$l][0][$i]['alt'] === 'One', $c[$l]);
}

// Variants.
$check('a known variant is kept', kit_variant($hero, 'centred') === 'centred');
$check('an unknown variant is the first', kit_variant($hero, 'sideways') === 'default' && kit_variant($hero, null) === 'default');
$check('a section without variants has default', kit_variant(['fields' => []], 'x') === 'default');

// Every demo comes out as kit's Go Fill makes it (compared in Go).
$demos = [];
foreach (json_decode(file_get_contents($demosFile), true) as $d) {
    $demos[] = kit_content($schema($d['section']), $d['content']);
}
echo json_encode(['checks' => $checks, 'demos' => $demos], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
