package brand

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"slices"
	"sort"
	"strings"
	"time"
)

// A pulled brand is a folder a site keeps in its own repository, so anyone
// with the repository can build the theme without access to Clients:
//
//	brand.json       the brand exactly as Clients published it (a version of it)
//	brand.lock.json  which client and version it is, when it was pulled, and each file's sha256
//	assets/          the fonts and logos the brand refers to (lib:<name>), checked against their sha256
//	kit.yaml         optional: the site's own token overrides; a pull never touches it
//
// `kit brand pull` refreshes it from Clients; `kit brand <folder>` builds the
// tokens from it, offline.

// Lock is brand.lock.json.
type Lock struct {
	Client  string            `json:"client"`
	Version int               `json:"version"`
	Source  string            `json:"source"`
	Pulled  string            `json:"pulled"`
	Files   map[string]string `json:"files"` // path in the folder -> sha256
}

// Asset is one entry of a published brand's assets: a file in the client's library.
type Asset struct {
	Kind   string `json:"kind" yaml:"kind"`
	Sha256 string `json:"sha256" yaml:"sha256"`
	Mime   string `json:"mime" yaml:"mime"`
	Bytes  int64  `json:"bytes" yaml:"bytes"`
	Width  int    `json:"width,omitempty" yaml:"width"`
	Height int    `json:"height,omitempty" yaml:"height"`
}

// Source is where a pull reads from: Clients' API, with a service key.
type Source struct {
	BaseURL string // e.g. http://127.0.0.1:8130 at the far end of an ssh tunnel
	Key     string // a Clients service key, sent as a bearer token
	HTTP    *http.Client
}

// Pulled is what a pull did.
type Pulled struct {
	Client    string
	From, To  int      // versions: 0 when there was no brand before
	Changes   []string // what changed in brand.json, one line each
	Written   []string // files written, relative to the folder
	Removed   []string // files no longer referenced, removed
	NotPulled []string // fonts the brand names that aren't files in its library (bundled families)
	Unchanged bool
}

// Pull fetches a client's published brand and its files into dir.
func Pull(ctx context.Context, src Source, client, dir string, now time.Time) (*Pulled, error) {
	if src.HTTP == nil {
		src.HTTP = &http.Client{Timeout: 60 * time.Second}
	}
	if !slugOK(client) {
		return nil, fmt.Errorf("%q isn't a client's slug (lower-case letters, digits and dashes)", client)
	}
	raw, err := src.get(ctx, "/v1/clients/"+url.PathEscape(client)+"/brand")
	if err != nil {
		return nil, err
	}
	var doc struct {
		Version int                 `json:"version"`
		Name    string              `json:"name"`
		Assets  map[string]Asset    `json:"assets"`
		Logos   map[string]string   `json:"logos"`
		Type    map[string]TypeRole `json:"type"`
	}
	if err := json.Unmarshal(raw, &doc); err != nil {
		return nil, fmt.Errorf("Clients' brand for %s isn't JSON: %w", client, err)
	}
	if doc.Version < 1 || doc.Name == "" {
		return nil, fmt.Errorf("Clients has no published brand for %s yet", client)
	}

	res := &Pulled{Client: client, To: doc.Version}
	var oldLock Lock
	if b, err := os.ReadFile(filepath.Join(dir, "brand.lock.json")); err == nil {
		if err := json.Unmarshal(b, &oldLock); err != nil {
			return nil, fmt.Errorf("brand.lock.json: %w", err)
		}
		if oldLock.Client != "" && oldLock.Client != client {
			return nil, fmt.Errorf("%s holds %s's brand, not %s's: pull into another folder", dir, oldLock.Client, client)
		}
		res.From = oldLock.Version
	}
	oldDoc, _ := os.ReadFile(filepath.Join(dir, "brand.json"))
	res.Changes = changes(oldDoc, raw)

	// The files the brand refers to: its fonts and logos in the library.
	want := map[string]bool{}
	for _, v := range doc.Logos {
		if n, ok := strings.CutPrefix(v, "lib:"); ok {
			want[n] = true
		}
	}
	for _, role := range doc.Type {
		for _, f := range []string{role.Font, role.ItalicFont} {
			if n, ok := strings.CutPrefix(f, "lib:"); ok {
				want[n] = true
			} else if f != "" && !slices.Contains(res.NotPulled, f) {
				res.NotPulled = append(res.NotPulled, f)
			}
		}
	}
	lock := Lock{Client: client, Version: doc.Version, Source: strings.TrimRight(src.BaseURL, "/"), Pulled: now.UTC().Format(time.RFC3339), Files: map[string]string{}}
	if err := os.MkdirAll(filepath.Join(dir, "assets"), 0o755); err != nil {
		return nil, err
	}
	names := make([]string, 0, len(want))
	for n := range want {
		names = append(names, n)
	}
	sort.Strings(names)
	for _, n := range names {
		a, ok := doc.Assets[n]
		if !ok {
			return nil, fmt.Errorf("the brand refers to lib:%s, which isn't in its assets", n)
		}
		if !slugOK(n) {
			return nil, fmt.Errorf("asset name %q isn't a plain name", n)
		}
		rel := "assets/" + n + Extension(a.Mime)
		lock.Files[rel] = a.Sha256
		if have, err := os.ReadFile(filepath.Join(dir, rel)); err == nil && sum(have) == a.Sha256 {
			continue // already here, unchanged
		}
		b, err := src.get(ctx, "/v1/assets/"+url.PathEscape(a.Sha256))
		if err != nil {
			return nil, fmt.Errorf("lib:%s: %w", n, err)
		}
		if sum(b) != a.Sha256 {
			return nil, fmt.Errorf("lib:%s: the file's sha256 doesn't match the brand's", n)
		}
		if err := os.WriteFile(filepath.Join(dir, rel), b, 0o644); err != nil { //nolint:gosec // a site's assets
			return nil, err
		}
		res.Written = append(res.Written, rel)
	}
	for rel := range oldLock.Files {
		if _, still := lock.Files[rel]; !still && strings.HasPrefix(rel, "assets/") && !strings.Contains(rel, "..") {
			if err := os.Remove(filepath.Join(dir, rel)); err == nil {
				res.Removed = append(res.Removed, rel)
			}
		}
	}
	sort.Strings(res.Removed)

	var pretty bytes.Buffer
	if err := json.Indent(&pretty, raw, "", "  "); err != nil {
		return nil, err
	}
	pretty.WriteByte('\n')
	if !bytes.Equal(oldDoc, pretty.Bytes()) {
		if err := os.WriteFile(filepath.Join(dir, "brand.json"), pretty.Bytes(), 0o644); err != nil { //nolint:gosec // a site's brand
			return nil, err
		}
		res.Written = append([]string{"brand.json"}, res.Written...)
	}
	lock.Files["brand.json"] = sum(pretty.Bytes())
	res.Unchanged = len(res.Written) == 0 && len(res.Removed) == 0 && res.From == res.To
	if res.Unchanged {
		return res, nil // leave the lock (and its pulled date) as it was
	}
	lb, _ := json.MarshalIndent(lock, "", "  ")
	if err := os.WriteFile(filepath.Join(dir, "brand.lock.json"), append(lb, '\n'), 0o644); err != nil { //nolint:gosec // a site's brand
		return nil, err
	}
	return res, nil
}

func (s Source) get(ctx context.Context, path string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, strings.TrimRight(s.BaseURL, "/")+path, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+s.Key)
	resp, err := s.HTTP.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Clients: %w", err)
	}
	defer resp.Body.Close()
	b, err := io.ReadAll(io.LimitReader(resp.Body, 64<<20))
	if err != nil {
		return nil, err
	}
	switch {
	case resp.StatusCode == http.StatusNotFound:
		return nil, fmt.Errorf("Clients: not found (%s)", path)
	case resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden:
		return nil, errors.New("Clients refused the key: it needs to be a service key")
	case resp.StatusCode != http.StatusOK:
		var p struct{ Title, Detail string }
		_ = json.Unmarshal(b, &p)
		return nil, fmt.Errorf("Clients: %s %s %s", resp.Status, p.Title, p.Detail)
	}
	return b, nil
}

// changes lists what differs between two brand documents, as dotted paths
// ("palette.accent: #2563EB → #0F766E"), leaving out assets (their files are
// reported as written) and the version (reported on its own).
func changes(oldDoc, newDoc []byte) []string {
	var a, b map[string]any
	if json.Unmarshal(oldDoc, &a) != nil {
		return nil // nothing before: everything is new
	}
	if json.Unmarshal(newDoc, &b) != nil {
		return nil
	}
	delete(a, "assets")
	delete(b, "assets")
	delete(a, "version")
	delete(b, "version")
	fa, fb := map[string]string{}, map[string]string{}
	flatten("", a, fa)
	flatten("", b, fb)
	keys := map[string]bool{}
	for k := range fa {
		keys[k] = true
	}
	for k := range fb {
		keys[k] = true
	}
	var out []string
	for k := range keys {
		switch av, bv := fa[k], fb[k]; {
		case av == bv:
		case av == "":
			out = append(out, fmt.Sprintf("%s: added %s", k, bv))
		case bv == "":
			out = append(out, fmt.Sprintf("%s: removed (was %s)", k, av))
		default:
			out = append(out, fmt.Sprintf("%s: %s → %s", k, av, bv))
		}
	}
	sort.Strings(out)
	return out
}

func flatten(prefix string, v any, out map[string]string) {
	switch x := v.(type) {
	case map[string]any:
		for k, sub := range x {
			p := k
			if prefix != "" {
				p = prefix + "." + k
			}
			flatten(p, sub, out)
		}
	default:
		b, _ := json.Marshal(x)
		out[prefix] = strings.Trim(string(b), `"`)
	}
}

func sum(b []byte) string {
	h := sha256.Sum256(b)
	return hex.EncodeToString(h[:])
}

func slugOK(s string) bool {
	if s == "" {
		return false
	}
	for _, r := range s {
		if (r < 'a' || r > 'z') && (r < '0' || r > '9') && r != '-' {
			return false
		}
	}
	return true
}

// Extension is a file extension for an asset's media type.
func Extension(mime string) string {
	switch mime {
	case "font/ttf":
		return ".ttf"
	case "font/otf":
		return ".otf"
	case "font/woff":
		return ".woff"
	case "font/woff2":
		return ".woff2"
	case "image/svg+xml":
		return ".svg"
	case "image/png":
		return ".png"
	case "image/jpeg":
		return ".jpg"
	case "image/webp":
		return ".webp"
	}
	return ".bin"
}
