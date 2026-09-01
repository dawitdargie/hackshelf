package books

import (
	"testing"
)

func TestParsePositiveInt(t *testing.T) {
	cases := []struct {
		name    string
		value   string
		def     int
		want    int
		wantErr bool
	}{
		{"empty uses default", "", 20, 20, false},
		{"valid page", "3", 1, 3, false},
		{"zero invalid", "0", 1, 0, true},
		{"negative invalid", "-2", 1, 0, true},
		{"non-numeric invalid", "abc", 1, 0, true},
		{"float invalid", "1.5", 1, 0, true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, appErr := parsePositiveInt(tc.value, tc.def, "page")
			if (appErr != nil) != tc.wantErr {
				t.Fatalf("wantErr=%v, got appErr=%v", tc.wantErr, appErr)
			}
			if appErr == nil && got != tc.want {
				t.Fatalf("want %d, got %d", tc.want, got)
			}
			if appErr != nil && appErr.Status != 422 {
				t.Fatalf("expected 422 status, got %d", appErr.Status)
			}
		})
	}
}

func TestNewPaginationMeta(t *testing.T) {
	cases := []struct {
		total, limit, wantPages int
	}{
		{100, 20, 5},
		{101, 20, 6},
		{0, 20, 1}, // empty catalog still reports one page
		{1, 100, 1},
	}
	for _, tc := range cases {
		meta := newPaginationMeta(1, tc.limit, tc.total)
		if meta.TotalPages != tc.wantPages {
			t.Fatalf("total=%d limit=%d: want %d pages, got %d", tc.total, tc.limit, tc.wantPages, meta.TotalPages)
		}
	}
}

func TestValidateSort(t *testing.T) {
	valid := map[string]SortOption{
		"":           SortNewest, // default
		"  ":         SortNewest, // whitespace → default
		"newest":     SortNewest,
		"rating":     SortRating,
		"most-rated": SortMostRated,
	}
	for in, want := range valid {
		got, appErr := validateSort(in)
		if appErr != nil || got != want {
			t.Errorf("validateSort(%q): want %q, got %q, err %v", in, want, got, appErr)
		}
	}
	for _, in := range []string{"bogus", "rating;DROP TABLE books", "RATING", "most_rated"} {
		_, appErr := validateSort(in)
		if appErr == nil || appErr.Status != 422 {
			t.Errorf("validateSort(%q): expected 422, got %v", in, appErr)
		}
	}
}

func TestParseRating(t *testing.T) {
	// Empty → nil (no filter).
	if r, appErr := parseRating(""); appErr != nil || r != nil {
		t.Errorf("empty rating: want nil filter, got %v, %v", r, appErr)
	}
	// Valid range.
	for _, in := range []string{"1", "3.5", "5", " 4 "} {
		r, appErr := parseRating(in)
		if appErr != nil || r == nil || *r < 1 || *r > 5 {
			t.Errorf("parseRating(%q): expected valid, got %v, %v", in, r, appErr)
		}
	}
	// Invalid.
	for _, in := range []string{"0", "5.1", "9", "abc", "-1", "'; DROP TABLE books;--"} {
		_, appErr := parseRating(in)
		if appErr == nil || appErr.Status != 422 {
			t.Errorf("parseRating(%q): expected 422, got %v", in, appErr)
		}
	}
}

func TestSlugRegex(t *testing.T) {
	valid := []string{"example-book", "a", "owasp-testing-guide-v4", "123"}
	invalid := []string{"", "-lead", "trail-", "has space", "UPPER", "double--hyphen", "under_score", "../../etc"}
	for _, s := range valid {
		if !slugRegex.MatchString(s) {
			t.Errorf("expected valid slug: %q", s)
		}
	}
	for _, s := range invalid {
		if slugRegex.MatchString(s) {
			t.Errorf("expected invalid slug: %q", s)
		}
	}
}
