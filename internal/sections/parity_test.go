package sections

import (
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

// renderPHP runs compiled templates in real PHP: each case is a template
// (compiled), its props and the HTML kit's Go renderer made. Warnings fail
// the run, as a missing key would be a bug.
func renderPHP(t *testing.T, cases []phpCase) []string {
	t.Helper()
	php, err := exec.LookPath("php")
	if err != nil {
		t.Skip("php isn't installed")
	}
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "kit.php"), []byte(Runtime), 0o600); err != nil {
		t.Fatal(err)
	}
	var jobs []map[string]any
	for i, c := range cases {
		f := filepath.Join(dir, "t"+itoa(i)+".php")
		if err := os.WriteFile(f, []byte(c.tpl.PHP("test")), 0o600); err != nil {
			t.Fatal(err)
		}
		jobs = append(jobs, map[string]any{"file": f, "props": c.props})
	}
	jb, _ := json.Marshal(jobs)
	if err := os.WriteFile(filepath.Join(dir, "jobs.json"), jb, 0o600); err != nil {
		t.Fatal(err)
	}
	runner := `<?php
set_error_handler(function ($no, $msg, $file, $line) { throw new ErrorException($msg, 0, $no, $file, $line); });
require __DIR__ . '/kit.php';
$out = [];
foreach (json_decode(file_get_contents(__DIR__ . '/jobs.json'), true) as $job) {
    try {
        $out[] = kit_section($job['file'], $job['props']);
    } catch (Throwable $e) {
        $out[] = 'ERROR: ' . $e->getMessage();
    }
}
echo json_encode($out);
`
	if err := os.WriteFile(filepath.Join(dir, "run.php"), []byte(runner), 0o600); err != nil {
		t.Fatal(err)
	}
	b, err := exec.Command(php, filepath.Join(dir, "run.php")).CombinedOutput()
	if err != nil {
		t.Fatalf("php: %v\n%s", err, b)
	}
	var out []string
	if err := json.Unmarshal(b, &out); err != nil {
		t.Fatalf("php output: %v\n%s", err, b)
	}
	return out
}

type phpCase struct {
	name  string // the Blade view's name
	src   string // its Blade source
	tpl   *Template
	props map[string]any
}

func itoa(i int) string { b, _ := json.Marshal(i); return string(b) }

// TestSectionsMatchPHPAndBlade renders every demo of every section in Go, as
// compiled PHP and with Blade, and fails if the HTML differs by a byte.
func TestSectionsMatchPHPAndBlade(t *testing.T) {
	secs, err := Load("../../sections")
	if err != nil {
		t.Fatal(err)
	}
	var cases []phpCase
	var want, names []string
	for _, s := range secs {
		for _, d := range s.Demos {
			v := d.Variant
			if v == "" {
				v = s.Schema.Variants[0].Name
			}
			props := map[string]any{"content": s.Schema.Fill(d.Content), "variant": v}
			html, err := s.Template.Render(props)
			if err != nil {
				t.Fatal(err)
			}
			cases = append(cases, phpCase{s.Name, s.Source, s.Template, props})
			want = append(want, html)
			names = append(names, s.Name+": "+d.Title)
		}
	}
	compareAll(t, cases, want, names)
}

// compareAll renders the cases as compiled PHP and with Blade and compares
// each with what Go made.
func compareAll(t *testing.T, cases []phpCase, want, names []string) {
	t.Helper()
	t.Run("php", func(t *testing.T) {
		got := renderPHP(t, cases)
		for i := range want {
			if got[i] != want[i] {
				t.Errorf("%s: PHP and Go differ\n--- go\n%s\n--- php\n%s", names[i], want[i], got[i])
			}
		}
	})
	t.Run("blade", func(t *testing.T) {
		got := renderBlade(t, cases)
		for i := range want {
			if got[i] != want[i] {
				t.Errorf("%s: Blade and Go differ\n--- go\n%s\n--- blade\n%s", names[i], want[i], got[i])
			}
		}
	})
}

// renderBlade renders the cases' Blade sources with real Blade
// (tests/blade, after composer install there).
func renderBlade(t *testing.T, cases []phpCase) []string {
	t.Helper()
	php, err := exec.LookPath("php")
	if err != nil {
		t.Skip("php isn't installed")
	}
	runner, _ := filepath.Abs("../../tests/blade/render.php")
	if _, err := os.Stat(filepath.Join(filepath.Dir(runner), "vendor")); err != nil {
		t.Skip("Blade isn't installed: composer install in tests/blade")
	}
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "kit.php"), []byte(Runtime), 0o600); err != nil {
		t.Fatal(err)
	}
	var jobs []map[string]any
	for _, c := range cases {
		if err := os.WriteFile(filepath.Join(dir, c.name+".blade.php"), []byte(c.src), 0o600); err != nil {
			t.Fatal(err)
		}
		jobs = append(jobs, map[string]any{"view": c.name, "props": c.props})
	}
	jb, _ := json.Marshal(jobs)
	jf := filepath.Join(dir, "jobs.json")
	if err := os.WriteFile(jf, jb, 0o600); err != nil {
		t.Fatal(err)
	}
	b, err := exec.Command(php, runner, dir, jf).CombinedOutput()
	if err != nil {
		t.Fatalf("blade: %v\n%s", err, b)
	}
	var out []string
	if err := json.Unmarshal(b, &out); err != nil {
		t.Fatalf("blade output: %v\n%s", err, b)
	}
	return out
}

// The compiled .php committed beside each template is current.
func TestCompiledPHPIsCurrent(t *testing.T) {
	secs, err := Load("../../sections")
	if err != nil {
		t.Fatal(err)
	}
	for _, s := range secs {
		have, err := os.ReadFile(filepath.Join(s.Dir, s.Name+".php"))
		want := s.Template.PHP("sections/" + s.Name + "/" + s.Name + ".blade.php")
		if err != nil || string(have) != want {
			t.Errorf("sections/%s/%s.php is out of date: run kit section compile", s.Name, s.Name)
		}
	}
}
