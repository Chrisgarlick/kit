package brand

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// fakeClients serves one client's brand and its library, as Clients does.
type fakeClients struct {
	doc    map[string]any
	files  map[string][]byte // sha256 -> bytes
	hits   []string
	broken bool // serve the wrong bytes for every asset
}

func (f *fakeClients) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	f.hits = append(f.hits, r.URL.Path)
	if r.Header.Get("Authorization") != "Bearer ck_test_secret" {
		w.WriteHeader(http.StatusForbidden)
		return
	}
	switch {
	case r.URL.Path == "/v1/clients/acme/brand":
		_ = json.NewEncoder(w).Encode(f.doc)
	case strings.HasPrefix(r.URL.Path, "/v1/assets/"):
		b, ok := f.files[strings.TrimPrefix(r.URL.Path, "/v1/assets/")]
		if !ok {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		if f.broken {
			b = []byte("not the font")
		}
		_, _ = w.Write(b)
	default:
		w.WriteHeader(http.StatusNotFound)
	}
}

func newFake() *fakeClients {
	font, logo := []byte("font bytes"), []byte("<svg/>")
	f := &fakeClients{files: map[string][]byte{sum(font): font, sum(logo): logo}}
	f.doc = map[string]any{
		"brand": 1, "name": "Acme", "version": 1,
		"palette": map[string]any{"paper": "#FFFFFF", "ink": "#111111", "accent": "#0F5FD6"},
		"type": map[string]any{
			"display": map[string]any{"font": "lib:acme-sans", "weight": 700},
			"mono":    map[string]any{"font": "JetBrains Mono"},
		},
		"logos": map[string]any{"primary": "lib:acme-logo"},
		"assets": map[string]any{
			"acme-sans": map[string]any{"kind": "font", "sha256": sum(font), "mime": "font/ttf", "bytes": len(font)},
			"acme-logo": map[string]any{"kind": "image", "sha256": sum(logo), "mime": "image/svg+xml", "bytes": len(logo)},
		},
	}
	return f
}

func TestPullThenUpdate(t *testing.T) {
	fake := newFake()
	srv := httptest.NewServer(fake)
	defer srv.Close()
	dir := t.TempDir()
	src := Source{BaseURL: srv.URL, Key: "ck_test_secret"}
	now := time.Date(2026, 11, 12, 9, 0, 0, 0, time.UTC)

	res, err := Pull(context.Background(), src, "acme", dir, now)
	if err != nil {
		t.Fatal(err)
	}
	if res.From != 0 || res.To != 1 || len(res.Written) != 3 || strings.Join(res.NotPulled, ",") != "JetBrains Mono" {
		t.Fatalf("first pull: %+v", res)
	}
	for _, f := range []string{"brand.json", "brand.lock.json", "assets/acme-sans.ttf", "assets/acme-logo.svg"} {
		if _, err := os.Stat(filepath.Join(dir, f)); err != nil {
			t.Errorf("%s: %v", f, err)
		}
	}
	// The local copy builds on its own, with the brand's font served from assets/.
	out, err := Generate(dir)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(out["fonts.css"]), `src: url("assets/acme-sans.ttf")`) || !strings.Contains(string(out["tokens.css"]), "--kit-accent") {
		t.Fatalf("generated: %s", out["fonts.css"])
	}

	// The same version again changes nothing, and fetches no assets.
	fake.hits = nil
	res, err = Pull(context.Background(), src, "acme", dir, now.Add(time.Hour))
	if err != nil || !res.Unchanged {
		t.Fatalf("second pull: %+v, %v", res, err)
	}
	for _, h := range fake.hits {
		if strings.HasPrefix(h, "/v1/assets/") {
			t.Errorf("fetched %s again", h)
		}
	}

	// Version 2: a new accent, and the logo dropped.
	fake.doc["version"] = 2
	fake.doc["palette"].(map[string]any)["accent"] = "#0F766E"
	delete(fake.doc, "logos")
	res, err = Pull(context.Background(), src, "acme", dir, now.Add(2*time.Hour))
	if err != nil {
		t.Fatal(err)
	}
	joined := strings.Join(res.Changes, "\n")
	if res.From != 1 || res.To != 2 || !strings.Contains(joined, "palette.accent: #0F5FD6 → #0F766E") || !strings.Contains(joined, "logos.primary: removed") {
		t.Fatalf("update: %+v", res)
	}
	if strings.Join(res.Removed, ",") != "assets/acme-logo.svg" {
		t.Fatalf("removed %v", res.Removed)
	}
	var lock Lock
	b, _ := os.ReadFile(filepath.Join(dir, "brand.lock.json"))
	if err := json.Unmarshal(b, &lock); err != nil || lock.Version != 2 || lock.Client != "acme" || lock.Files["assets/acme-sans.ttf"] == "" {
		t.Fatalf("lock %+v, %v", lock, err)
	}
	if strings.Contains(string(b), "ck_test") {
		t.Fatal("the key ended up in the lock file")
	}
}

func TestPullRefusesBadFilesAndTheWrongFolder(t *testing.T) {
	fake := newFake()
	fake.broken = true
	srv := httptest.NewServer(fake)
	defer srv.Close()
	src := Source{BaseURL: srv.URL, Key: "ck_test_secret"}
	if _, err := Pull(context.Background(), src, "acme", t.TempDir(), time.Now()); err == nil || !strings.Contains(err.Error(), "sha256") {
		t.Fatalf("want a sha256 error, got %v", err)
	}
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "brand.lock.json"), []byte(`{"client":"other","version":3}`), 0o600); err != nil {
		t.Fatal(err)
	}
	if _, err := Pull(context.Background(), src, "acme", dir, time.Now()); err == nil || !strings.Contains(err.Error(), "other's brand") {
		t.Fatalf("want a wrong-folder error, got %v", err)
	}
	if _, err := Pull(context.Background(), Source{BaseURL: srv.URL, Key: "wrong"}, "acme", t.TempDir(), time.Now()); err == nil || !strings.Contains(err.Error(), "service key") {
		t.Fatalf("want a key error, got %v", err)
	}
}
