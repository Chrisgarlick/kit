<?php
// Renders kit sections with real Blade: php render.php <views dir> <jobs.json>
// jobs: [{"view": "hero", "props": {...}}]; prints a JSON list of HTML.
require __DIR__ . '/vendor/autoload.php';
use Illuminate\Container\Container;
use Illuminate\Events\Dispatcher;
use Illuminate\Filesystem\Filesystem;
use Illuminate\View\Compilers\BladeCompiler;
use Illuminate\View\Engines\CompilerEngine;
use Illuminate\View\Engines\EngineResolver;
use Illuminate\View\Factory;
use Illuminate\View\FileViewFinder;

set_error_handler(function ($no, $msg, $file, $line) { throw new ErrorException($msg, 0, $no, $file, $line); });
[$_, $views, $jobsFile] = $argv;
require $views . '/kit.php';
$fs = new Filesystem;
$cache = sys_get_temp_dir() . '/kit-blade-' . getmypid();
@mkdir($cache);
$container = new Container;
Container::setInstance($container);
$compiler = new BladeCompiler($fs, $cache);
$resolver = new EngineResolver;
$resolver->register('blade', fn () => new CompilerEngine($compiler, $fs));
$factory = new Factory($resolver, new FileViewFinder($fs, [$views]), new Dispatcher($container));
$container->instance(\Illuminate\Contracts\View\Factory::class, $factory);
$out = [];
foreach (json_decode(file_get_contents($jobsFile), true) as $job) {
    try {
        $out[] = $factory->make($job['view'], $job['props'])->render();
    } catch (Throwable $e) {
        $out[] = 'ERROR: ' . $e->getMessage();
    }
}
$fs->deleteDirectory($cache);
echo json_encode($out);
