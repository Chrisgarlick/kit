<?php
// The sections as plain PHP, as a project without Blade uses them: `make sections-php`
// exports them into .out/ next to this file and serves it at http://localhost:8160.
// ?demo=1 picks each section's second demo.
require __DIR__ . '/kit/kit.php';
$n = (int) ($_GET['demo'] ?? 0);
$demo = function ($name) use ($n) {
    $all = json_decode(file_get_contents(__DIR__ . "/kit/$name.demo.json"), true);
    return $all[min($n, count($all) - 1)];
};
?><!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>kit sections in PHP</title>
<link rel="stylesheet" href="kit.css">
<?php foreach (['header', 'hero', 'footer'] as $s): ?><link rel="stylesheet" href="kit/<?= $s ?>.css"><?php endforeach ?>
<style>body { margin: 0; background: var(--kit-bg); }</style>
</head><body>
<?php foreach (['header', 'hero', 'footer'] as $s): $d = $demo($s);
  echo kit_section(__DIR__ . "/kit/$s.php", ['content' => $d['content'], 'variant' => $d['variant']]);
endforeach ?>
</body></html>
