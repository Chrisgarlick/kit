<?php
// The generated cg-cms blocks, loaded against stand-ins for cg-cms's Block and
// Field (which record what's called on them), and every fixture rendered
// through kit_cgcms_block() as a cg-cms page would. Run by cgcms_test.go as
// php cgcms.php <out> <fixtures.json>; prints {"blocks": [...], "html": [...]}.

namespace Cg\Cms\Schema {
    final class Field
    {
        public array $calls = [];

        private function __construct(public string $type, public string $name) {}

        public static function __callStatic(string $type, array $args): self
        {
            return new self($type, $args[0]);
        }

        public function __call(string $method, array $args): self
        {
            $this->calls[$method] = $method === 'fields' ? array_map(fn (self $f) => $f->toArray(), $args[0]) : ($args[0] ?? true);
            return $this;
        }

        public function toArray(): array
        {
            return ['type' => $this->type, 'name' => $this->name] + $this->calls;
        }
    }

    final class Block
    {
        public array $fields = [];
        public string $view = '';

        private function __construct(public string $handle, public string $label) {}

        public static function make(string $handle, string $label): self
        {
            return new self($handle, $label);
        }

        public function fields(array $fields): self
        {
            $this->fields = array_map(fn (Field $f) => $f->toArray(), $fields);
            return $this;
        }

        public function view(string $view): self
        {
            $this->view = $view;
            return $this;
        }
    }
}

namespace {
    set_error_handler(function ($no, $msg, $file, $line) { throw new ErrorException($msg, 0, $no, $file, $line); });
    [, $out, $fixtures] = $argv;
    $blocks = require $out . '/kit-blocks.php';
    $again = require $out . '/kit-blocks.php'; // as Block::app() does, every call
    $html = [];
    foreach (json_decode(file_get_contents($fixtures), true) as $f) {
        try {
            $html[] = kit_cgcms_block($f['section'], $f['data'], [])->toHtml();
        } catch (Throwable $e) {
            $html[] = 'ERROR: ' . $e->getMessage();
        }
    }
    echo json_encode([
        'blocks' => array_map(fn ($b) => ['handle' => $b->handle, 'label' => $b->label, 'view' => $b->view, 'fields' => $b->fields], $blocks),
        'again' => count($again),
        'html' => $html,
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}
