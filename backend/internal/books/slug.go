package books

import "regexp"

// UUIDRegex validates UUID strings (used by path parameters that key on IDs).
var UUIDRegex = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)

// SlugRegex validates URL slugs: lowercase letters, digits, and hyphens,
// starting and ending with an alphanumeric character. Exported for reuse by
// the taxonomy packages.
var SlugRegex = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)

var slugRegex = SlugRegex
