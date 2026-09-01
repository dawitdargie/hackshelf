package books

import "regexp"

// SlugRegex validates URL slugs: lowercase letters, digits, and hyphens,
// starting and ending with an alphanumeric character. Exported for reuse by
// the taxonomy packages.
var SlugRegex = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)

var slugRegex = SlugRegex
