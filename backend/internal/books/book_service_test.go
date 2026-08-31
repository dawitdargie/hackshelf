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
