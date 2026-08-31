package books

import "regexp"

// slugRegex validates URL slugs: lowercase letters, digits, and hyphens,
// starting and ending with an alphanumeric character.
var slugRegex = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)
