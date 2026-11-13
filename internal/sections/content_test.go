package sections

import (
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"testing"
)

// TestContentPHP runs kit_content() and its parts in real PHP
// (testdata/content.php): casting, filling, binding, unsafe values and image
// resolution, and every demo filled exactly as Schema.Fill fills it.
func TestContentPHP(t *testing.T) {
	php, err := exec.LookPath("php")
	if err != nil {
		t.Skip("php isn't installed")
	}
	secs, err := Load("../../sections")
	if err != nil {
		t.Fatal(err)
	}
	type demo struct {
		Section string         `json:"section"`
		Content map[string]any `json:"content"`
	}
	var demos []demo
	var want []any
	for _, s := range secs {
		for _, d := range s.Demos {
			demos = append(demos, demo{s.Name, d.Content})
			want = append(want, s.Schema.Fill(d.Content))
		}
	}
	dir := t.TempDir()
	rt := filepath.Join(dir, "kit.php")
	if err := os.WriteFile(rt, []byte(Runtime), 0o600); err != nil {
		t.Fatal(err)
	}
	jb, _ := json.Marshal(demos)
	df := filepath.Join(dir, "demos.json")
	if err := os.WriteFile(df, jb, 0o600); err != nil {
		t.Fatal(err)
	}
	sdir, _ := filepath.Abs("../../sections")
	b, err := exec.Command(php, "testdata/content.php", rt, sdir, df).CombinedOutput()
	if err != nil {
		t.Fatalf("php: %v\n%s", err, b)
	}
	var out struct {
		Checks [][3]any `json:"checks"`
		Demos  []any    `json:"demos"`
	}
	if err := json.Unmarshal(b, &out); err != nil {
		t.Fatalf("php output: %v\n%s", err, b)
	}
	if len(out.Checks) < 30 {
		t.Errorf("only %d checks ran", len(out.Checks))
	}
	for _, c := range out.Checks {
		if ok, _ := c[1].(bool); !ok {
			t.Errorf("%s: got %s", c[0], c[2])
		}
	}
	// Through JSON on both sides, so 2 and 2.0 compare equal.
	wb, _ := json.Marshal(want)
	var w []any
	_ = json.Unmarshal(wb, &w)
	for i := range w {
		if i >= len(out.Demos) || !reflect.DeepEqual(normalise(w[i]), normalise(out.Demos[i])) {
			got := any(nil)
			if i < len(out.Demos) {
				got = out.Demos[i]
			}
			t.Errorf("%s demo %d: kit_content differs from Fill\n--- go\n%v\n--- php\n%v", demos[i].Section, i, w[i], got)
		}
	}
}

// normalise makes PHP's empty array ([]) and an empty object the same, as
// json_encode can't tell them apart.
func normalise(v any) any {
	switch x := v.(type) {
	case map[string]any:
		if len(x) == 0 {
			return []any{}
		}
		m := map[string]any{}
		for k, e := range x {
			m[k] = normalise(e)
		}
		return m
	case []any:
		out := make([]any, len(x))
		for i, e := range x {
			out[i] = normalise(e)
		}
		return out
	}
	return v
}
