<?php
// The generated block views rendered with real Blade (tests/blade's
// illuminate/view), as cg-cms's BlockRenderer renders a block: the view
// kit-blocks::<name> with $data. Run by cgcms_test.go as
// php cgcms-blade.php <tests/blade> <out> <fixtures.json>; prints a JSON list:
// the HTML of each fixture, then the head of a page with two heroes.
[, $blade, $out, $fixtures] = $argv;
require $blade . '/vendor/autoload.php';
use Illuminate\Container\Container;
use Illuminate\Events\Dispatcher;
use Illuminate\Filesystem\Filesystem;
use Illuminate\View\Compilers\BladeCompiler;
use Illuminate\View\Engines\CompilerEngine;
use Illuminate\View\Engines\EngineResolver;
use Illuminate\View\Factory;
use Illuminate\View\FileViewFinder;

set_error_handler(function ($no, $msg, $file, $line) { throw new ErrorException($msg, 0, $no, $file, $line); });
require $out . '/kit/cgcms.php';
$fs = new Filesystem;
$cache = sys_get_temp_dir() . '/kit-cgcms-blade-' . getmypid();
@mkdir($cache);
$container = new Container;
Container::setInstance($container);
$compiler = new BladeCompiler($fs, $cache);
$resolver = new EngineResolver;
$resolver->register('blade', fn () => new CompilerEngine($compiler, $fs));
$factory = new Factory($resolver, new FileViewFinder($fs, []), new Dispatcher($container));
$factory->addNamespace('kit-blocks', $out . '/views');
$container->instance(\Illuminate\Contracts\View\Factory::class, $factory);
$html = [];
foreach (json_decode(file_get_contents($fixtures), true) as $f) {
    try {
        $html[] = $factory->make('kit-blocks::' . $f['section'], ['data' => $f['data']])->render();
    } catch (Throwable $e) {
        $html[] = 'ERROR: ' . $e->getMessage();
    }
}
// A page with two heroes: its layout's stack has the hero's CSS once.
@mkdir($cache . '/page');
file_put_contents($cache . '/page/page.blade.php', "@include('kit-blocks::hero', ['data' => []])\n@include('kit-blocks::hero', ['data' => []])\n<head>@stack('kit-styles')</head>");
$factory->addNamespace('test', $cache . '/page');
$page = $factory->make('test::page')->render();
$html[] = substr($page, strpos($page, '<head>'));
$fs->deleteDirectory($cache);
echo json_encode($html);
