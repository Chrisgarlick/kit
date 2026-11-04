package brand

import (
	"fmt"
	"math"
	"strconv"
	"strings"
)

// Colour is an sRGB colour with alpha, each channel 0 to 1.
type Colour struct{ R, G, B, A float64 }

var (
	white = Colour{1, 1, 1, 1}
	black = Colour{0, 0, 0, 1}
)

// ParseColour reads #RRGGBB or #RRGGBBAA, as the brand format allows.
func ParseColour(s string) (Colour, error) {
	h := strings.TrimPrefix(strings.TrimSpace(s), "#")
	if len(h) != 6 && len(h) != 8 {
		return Colour{}, fmt.Errorf("%q is not #RRGGBB or #RRGGBBAA", s)
	}
	n, err := strconv.ParseUint(h, 16, 32)
	if err != nil {
		return Colour{}, fmt.Errorf("%q is not a hex colour", s)
	}
	if len(h) == 6 {
		n = n<<8 | 0xff
	}
	return Colour{float64(n>>24&0xff) / 255, float64(n>>16&0xff) / 255, float64(n>>8&0xff) / 255, float64(n&0xff) / 255}, nil
}

func channel(v float64) uint8 { return uint8(math.Round(math.Max(0, math.Min(1, v)) * 255)) }

// Hex is #RRGGBB, or #RRGGBBAA when the colour isn't opaque.
func (c Colour) Hex() string {
	s := fmt.Sprintf("#%02X%02X%02X", channel(c.R), channel(c.G), channel(c.B))
	if channel(c.A) != 255 {
		s += fmt.Sprintf("%02X", channel(c.A))
	}
	return s
}

// WithAlpha returns the colour at alpha a.
func (c Colour) WithAlpha(a float64) Colour { c.A = math.Max(0, math.Min(1, a)); return c }

// Mix moves a toward b by t (0 is a, 1 is b), alpha included.
func Mix(a, b Colour, t float64) Colour {
	return Colour{a.R + (b.R-a.R)*t, a.G + (b.G-a.G)*t, a.B + (b.B-a.B)*t, a.A + (b.A-a.A)*t}
}

// Over composites c over an opaque background.
func (c Colour) Over(bg Colour) Colour {
	return Colour{c.R*c.A + bg.R*(1-c.A), c.G*c.A + bg.G*(1-c.A), c.B*c.A + bg.B*(1-c.A), 1}
}

// Luminance is WCAG's relative luminance.
func (c Colour) Luminance() float64 {
	f := func(v float64) float64 {
		if v <= 0.03928 {
			return v / 12.92
		}
		return math.Pow((v+0.055)/1.055, 2.4)
	}
	return 0.2126*f(c.R) + 0.7152*f(c.G) + 0.0722*f(c.B)
}

// Contrast is the WCAG contrast ratio of fg (composited over bg) against bg.
func Contrast(fg, bg Colour) float64 {
	a, b := fg.Over(bg).Luminance(), bg.Luminance()
	if a < b {
		a, b = b, a
	}
	return (a + 0.05) / (b + 0.05)
}
