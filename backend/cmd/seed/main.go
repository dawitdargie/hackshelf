// Command seed loads the HackShelf catalog — levels, authors, categories,
// topics, books and their hosted chapters — from the embedded data directory.
//
// It is idempotent: records are upserted by slug, so repeated runs converge on
// the same catalog. HackShelf only catalogs books that may legally be
// redistributed and that can be read in full inside the app, so the validator
// refuses any book without at least one chapter.
package main

import (
	"context"
	"embed"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io/fs"
	"os"
	"path"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"hackshelf/backend/internal/config"
)

//go:embed data
var dataFS embed.FS

type level struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
	SortOrder   int    `json:"sort_order"`
}

type author struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
	Bio  string `json:"bio"`
}

type category struct {
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
}

type topic struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type book struct {
	Title           string   `json:"title"`
	Slug            string   `json:"slug"`
	Description     string   `json:"description"`
	Level           string   `json:"level"`
	Authors         []string `json:"authors"`
	Categories      []string `json:"categories"`
	Topics          []string `json:"topics"`
	SourceURL       string   `json:"source_url"`
	License         string   `json:"license"`
	PublicationDate string   `json:"publication_date"`
	CoverURL        string   `json:"cover_url"`
}

type chapter struct {
	Slug    string
	Title   string
	Order   int
	Content string
}

// catalog is the fully loaded and validated seed data.
type catalog struct {
	Levels     []level
	Authors    []author
	Categories []category
	Topics     []topic
	Books      []book
	Chapters   map[string][]chapter // keyed by book slug
}

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)

func main() {
	var (
		dryRun = flag.Bool("dry-run", false, "validate and print the plan without writing to the database")
		dev    = flag.Bool("dev", false, "seed only the first book, for a quick smoke test")
		reset  = flag.Bool("reset", false, "delete all catalog content before seeding")
	)
	flag.Parse()

	if err := run(*dryRun, *dev, *reset); err != nil {
		fmt.Fprintf(os.Stderr, "\nseed failed: %v\n", err)
		os.Exit(1)
	}
}

func run(dryRun, dev, reset bool) error {
	config.LoadDotEnv()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return fmt.Errorf("DATABASE_URL environment variable is required")
	}

	cat, err := load(dev)
	if err != nil {
		return err
	}

	printPlan(cat, dryRun, reset)
	if dryRun {
		fmt.Println("\nDry run complete: data is valid, nothing was written.")
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return fmt.Errorf("failed to create connection pool: %w", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if err := write(ctx, tx, cat, reset); err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit: %w", err)
	}

	return printSummary(ctx, pool)
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

func load(dev bool) (*catalog, error) {
	cat := &catalog{Chapters: map[string][]chapter{}}

	if err := readJSON("data/levels.json", &cat.Levels); err != nil {
		return nil, err
	}
	if err := readJSON("data/authors.json", &cat.Authors); err != nil {
		return nil, err
	}
	if err := readJSON("data/categories.json", &cat.Categories); err != nil {
		return nil, err
	}
	if err := readJSON("data/topics.json", &cat.Topics); err != nil {
		return nil, err
	}

	entries, err := fs.ReadDir(dataFS, "data/books")
	if err != nil {
		return nil, fmt.Errorf("read data/books: %w", err)
	}
	names := make([]string, 0, len(entries))
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".json") {
			names = append(names, e.Name())
		}
	}
	sort.Strings(names)
	if len(names) == 0 {
		return nil, fmt.Errorf("no book files found in data/books")
	}
	if dev {
		names = names[:1]
		fmt.Printf("dev mode: seeding only %s\n", names[0])
	}

	for _, name := range names {
		var b book
		if err := readJSON(path.Join("data/books", name), &b); err != nil {
			return nil, err
		}
		chapters, err := loadChapters(b)
		if err != nil {
			return nil, err
		}
		cat.Books = append(cat.Books, b)
		cat.Chapters[b.Slug] = chapters
	}

	if err := validate(cat); err != nil {
		return nil, err
	}
	return cat, nil
}

func readJSON(name string, target any) error {
	raw, err := dataFS.ReadFile(name)
	if err != nil {
		return fmt.Errorf("read %s: %w", name, err)
	}
	dec := json.NewDecoder(strings.NewReader(string(raw)))
	dec.DisallowUnknownFields()
	if err := dec.Decode(target); err != nil {
		return fmt.Errorf("parse %s: %w", name, err)
	}
	return nil
}

var (
	chapterFilePattern = regexp.MustCompile(`^(\d+)-(.+)\.md$`)
	headingPattern     = regexp.MustCompile(`(?m)^#\s+(.+?)\s*$`)
)

// loadChapters reads the markdown files for a book. Files are named
// NN-slug.md; NN determines the reading order and "slug" becomes the chapter
// slug, which is also the location recorded in reading progress and bookmarks.
func loadChapters(b book) ([]chapter, error) {
	dir := path.Join("data/chapters", b.Slug)
	entries, err := fs.ReadDir(dataFS, dir)
	if err != nil {
		return nil, fmt.Errorf("read %s for book %q: %w", dir, b.Slug, err)
	}

	type chapterFile struct {
		order int
		slug  string
		name  string
	}
	files := make([]chapterFile, 0, len(entries))
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		m := chapterFilePattern.FindStringSubmatch(e.Name())
		if m == nil {
			return nil, fmt.Errorf("%s: chapter file %q must be named NN-slug.md", dir, e.Name())
		}
		order, err := strconv.Atoi(m[1])
		if err != nil || order < 1 {
			return nil, fmt.Errorf("%s: chapter file %q has an invalid order prefix", dir, e.Name())
		}
		files = append(files, chapterFile{order: order, slug: m[2], name: e.Name()})
	}
	if len(files) == 0 {
		return nil, fmt.Errorf("book %q has no chapters in %s", b.Slug, dir)
	}
	sort.Slice(files, func(i, j int) bool { return files[i].order < files[j].order })

	chapters := make([]chapter, 0, len(files))
	for i, f := range files {
		raw, err := dataFS.ReadFile(path.Join(dir, f.name))
		if err != nil {
			return nil, fmt.Errorf("read %s: %w", f.name, err)
		}
		content := strings.TrimSpace(strings.ReplaceAll(string(raw), "\r\n", "\n"))
		if content == "" {
			return nil, fmt.Errorf("%s is empty", path.Join(dir, f.name))
		}
		chapters = append(chapters, chapter{
			Slug:    f.slug,
			Title:   chapterTitle(content, f.slug),
			Order:   i + 1,
			Content: attributionNotice(b) + normalizeContent(content),
		})
	}
	return chapters, nil
}

// chapterTitle uses the document's first heading, falling back to the slug.
func chapterTitle(content, slug string) string {
	if m := headingPattern.FindStringSubmatch(content); m != nil {
		return strings.TrimSpace(m[1])
	}
	return humanize(slug)
}

func humanize(slug string) string {
	words := strings.Split(slug, "-")
	for i, w := range words {
		if w == "" {
			continue
		}
		words[i] = strings.ToUpper(w[:1]) + w[1:]
	}
	return strings.Join(words, " ")
}

// attributionNotice prefixes the licence attribution that CC BY-SA content
// requires to travel with the reproduced text.
func attributionNotice(b book) string {
	if b.SourceURL == "" {
		return ""
	}
	notice := fmt.Sprintf("> **Source:** [%s](%s)", b.Title, b.SourceURL)
	if b.License != "" {
		notice += fmt.Sprintf(" — licensed under %s", b.License)
	}
	return notice + "\n\n"
}

var (
	imagePattern = regexp.MustCompile(`!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)`)
	linkPattern  = regexp.MustCompile(`\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)`)
)

// normalizeContent keeps a chapter self-contained. Images and links that point
// at sibling files in the upstream repository cannot be resolved inside
// HackShelf, so they are reduced to plain text. Absolute URLs, in-page anchors
// and mail links are preserved.
func normalizeContent(s string) string {
	s = imagePattern.ReplaceAllStringFunc(s, func(m string) string {
		parts := imagePattern.FindStringSubmatch(m)
		if isAbsoluteURL(parts[2]) {
			return m
		}
		return strings.TrimSpace(parts[1])
	})
	s = linkPattern.ReplaceAllStringFunc(s, func(m string) string {
		parts := linkPattern.FindStringSubmatch(m)
		if isAbsoluteURL(parts[2]) {
			return m
		}
		return parts[1]
	})
	return s
}

func isAbsoluteURL(target string) bool {
	return strings.HasPrefix(target, "#") ||
		strings.HasPrefix(target, "http://") ||
		strings.HasPrefix(target, "https://") ||
		strings.HasPrefix(target, "mailto:")
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

// ref is a named taxonomy row (author, category or topic) used for the shared
// name/slug checks.
type ref struct {
	kind string
	name string
	slug string
}

// validate reports every problem it finds rather than stopping at the first,
// so a malformed data file can be corrected in a single pass.
func validate(cat *catalog) error {
	var problems []string
	add := func(format string, args ...any) {
		problems = append(problems, fmt.Sprintf(format, args...))
	}

	if len(cat.Levels) != 3 {
		add("expected exactly 3 levels (beginner, intermediate, advanced), found %d", len(cat.Levels))
	}
	levelSlugs := map[string]bool{}
	levelIDs := map[int]bool{}
	sortOrders := map[int]bool{}
	for _, l := range cat.Levels {
		if l.ID < 1 {
			add("level %q: id must be a positive number", l.Name)
		}
		if l.Name == "" {
			add("level %d: name is required", l.ID)
		}
		if !slugPattern.MatchString(l.Slug) {
			add("level %q: slug %q is not URL-safe", l.Name, l.Slug)
		}
		if levelSlugs[l.Slug] {
			add("level slug %q is duplicated", l.Slug)
		}
		if levelIDs[l.ID] {
			add("level id %d is duplicated", l.ID)
		}
		if sortOrders[l.SortOrder] {
			add("level sort_order %d is duplicated", l.SortOrder)
		}
		levelSlugs[l.Slug] = true
		levelIDs[l.ID] = true
		sortOrders[l.SortOrder] = true
	}

	refs := make([]ref, 0, len(cat.Authors)+len(cat.Categories)+len(cat.Topics))
	for _, a := range cat.Authors {
		refs = append(refs, ref{"author", a.Name, a.Slug})
	}
	for _, c := range cat.Categories {
		refs = append(refs, ref{"category", c.Name, c.Slug})
	}
	for _, t := range cat.Topics {
		refs = append(refs, ref{"topic", t.Name, t.Slug})
	}
	seen := map[string]bool{}
	for _, r := range refs {
		if r.name == "" {
			add("%s %q: name is required", r.kind, r.slug)
		}
		if !slugPattern.MatchString(r.slug) {
			add("%s %q: slug is not URL-safe", r.kind, r.slug)
		}
		key := r.kind + ":" + r.slug
		if seen[key] {
			add("%s slug %q is duplicated", r.kind, r.slug)
		}
		seen[key] = true
	}

	authorSlugs := make(map[string]bool, len(cat.Authors))
	for _, a := range cat.Authors {
		authorSlugs[a.Slug] = true
	}
	categorySlugs := make(map[string]bool, len(cat.Categories))
	for _, c := range cat.Categories {
		categorySlugs[c.Slug] = true
	}
	topicSlugs := make(map[string]bool, len(cat.Topics))
	for _, t := range cat.Topics {
		topicSlugs[t.Slug] = true
	}

	bookSlugs := map[string]bool{}
	for _, b := range cat.Books {
		if b.Title == "" {
			add("book %q: title is required", b.Slug)
		}
		if !slugPattern.MatchString(b.Slug) {
			add("book %q: slug is not URL-safe", b.Slug)
		}
		if bookSlugs[b.Slug] {
			add("book slug %q is duplicated", b.Slug)
		}
		bookSlugs[b.Slug] = true
		if strings.TrimSpace(b.Description) == "" {
			add("book %q: description is required", b.Slug)
		}
		if b.SourceURL == "" {
			add("book %q: source_url is required", b.Slug)
		} else if !strings.HasPrefix(b.SourceURL, "http://") && !strings.HasPrefix(b.SourceURL, "https://") {
			add("book %q: source_url must be an absolute URL", b.Slug)
		}
		if b.License == "" {
			add("book %q: license is required", b.Slug)
		}
		if !levelSlugs[b.Level] {
			add("book %q: level %q is not a known level slug", b.Slug, b.Level)
		}
		if b.PublicationDate != "" {
			if _, err := time.Parse("2006-01-02", b.PublicationDate); err != nil {
				add("book %q: publication_date %q must be formatted YYYY-MM-DD", b.Slug, b.PublicationDate)
			}
		}
		if b.CoverURL != "" && !isAbsoluteURL(b.CoverURL) && !strings.HasPrefix(b.CoverURL, "/") {
			add("book %q: cover_url must be an absolute URL or a root-relative path", b.Slug)
		}

		if len(b.Authors) == 0 {
			add("book %q: at least one author is required", b.Slug)
		}
		for _, s := range b.Authors {
			if !authorSlugs[s] {
				add("book %q: unknown author %q", b.Slug, s)
			}
		}
		if len(b.Categories) == 0 {
			add("book %q: at least one category is required", b.Slug)
		}
		for _, s := range b.Categories {
			if !categorySlugs[s] {
				add("book %q: unknown category %q", b.Slug, s)
			}
		}
		if len(b.Topics) == 0 {
			add("book %q: at least one topic is required", b.Slug)
		}
		for _, s := range b.Topics {
			if !topicSlugs[s] {
				add("book %q: unknown topic %q", b.Slug, s)
			}
		}

		chapters := cat.Chapters[b.Slug]
		if len(chapters) == 0 {
			add("book %q: must have at least one chapter so it can be read in full", b.Slug)
		}
		chapterSlugs := map[string]bool{}
		for _, ch := range chapters {
			if !slugPattern.MatchString(ch.Slug) {
				add("book %q: chapter slug %q is not URL-safe", b.Slug, ch.Slug)
			}
			if chapterSlugs[ch.Slug] {
				add("book %q: chapter slug %q is duplicated", b.Slug, ch.Slug)
			}
			chapterSlugs[ch.Slug] = true
			if ch.Order < 1 {
				add("book %q: chapter %q has an invalid order", b.Slug, ch.Slug)
			}
		}
	}

	if len(problems) > 0 {
		var sb strings.Builder
		sb.WriteString(fmt.Sprintf("seed data is invalid (%d problem(s)):\n", len(problems)))
		for _, p := range problems {
			sb.WriteString("  - " + p + "\n")
		}
		return errors.New(sb.String())
	}
	return nil
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

func printPlan(cat *catalog, dryRun, reset bool) {
	mode := ""
	if dryRun {
		mode = " (dry run)"
	}
	fmt.Printf("Catalog plan%s:\n", mode)
	fmt.Printf("  levels     : %d\n", len(cat.Levels))
	fmt.Printf("  authors    : %d\n", len(cat.Authors))
	fmt.Printf("  categories : %d\n", len(cat.Categories))
	fmt.Printf("  topics     : %d\n", len(cat.Topics))
	fmt.Printf("  books      : %d\n", len(cat.Books))
	total := 0
	for _, b := range cat.Books {
		n := len(cat.Chapters[b.Slug])
		total += n
		fmt.Printf("      - %-38s %d chapter(s)\n", b.Slug, n)
	}
	fmt.Printf("  chapters   : %d\n", total)

	if reset {
		fmt.Println("\n! -reset deletes all catalog content first, which also removes")
		fmt.Println("  user ratings, reviews, library entries and progress referencing it.")
	}
}

func write(ctx context.Context, tx pgx.Tx, cat *catalog, reset bool) error {
	if reset {
		fmt.Println("resetting catalog content...")
		for _, table := range []string{"books", "authors", "categories", "topics", "levels"} {
			if _, err := tx.Exec(ctx, "DELETE FROM "+table); err != nil {
				return fmt.Errorf("reset %s: %w", table, err)
			}
		}
	}

	for _, l := range cat.Levels {
		if _, err := tx.Exec(ctx, `
			INSERT INTO levels (id, name, slug, description, sort_order)
			VALUES ($1, $2, $3, NULLIF($4, ''), $5)
			ON CONFLICT (id) DO UPDATE SET
				name = EXCLUDED.name,
				slug = EXCLUDED.slug,
				description = EXCLUDED.description,
				sort_order = EXCLUDED.sort_order`,
			l.ID, l.Name, l.Slug, l.Description, l.SortOrder); err != nil {
			return fmt.Errorf("upsert level %q: %w", l.Slug, err)
		}
	}

	authorIDs, err := upsertAuthors(ctx, tx, cat.Authors)
	if err != nil {
		return err
	}
	categoryIDs, err := upsertCategories(ctx, tx, cat.Categories)
	if err != nil {
		return err
	}
	topicIDs, err := upsertTopics(ctx, tx, cat.Topics)
	if err != nil {
		return err
	}

	for _, b := range cat.Books {
		bookID, err := upsertBook(ctx, tx, b)
		if err != nil {
			return err
		}
		if err := replaceAssociations(ctx, tx, bookID, b, authorIDs, categoryIDs, topicIDs); err != nil {
			return err
		}
		// Chapters are replaced wholesale as well, so edits, renames, reordering
		// and removals in the data files are all applied on the next run.
		// Reading progress and bookmarks reference chapters by slug rather than
		// by id, so recreating these rows is safe.
		if _, err := tx.Exec(ctx, "DELETE FROM chapters WHERE book_id = $1", bookID); err != nil {
			return fmt.Errorf("clear chapters for book %q: %w", b.Slug, err)
		}
		for _, ch := range cat.Chapters[b.Slug] {
			if _, err := tx.Exec(ctx, `
				INSERT INTO chapters (book_id, slug, title, chapter_order, content)
				VALUES ($1, $2, $3, $4, $5)`,
				bookID, ch.Slug, ch.Title, ch.Order, ch.Content); err != nil {
				return fmt.Errorf("insert chapter %q of book %q: %w", ch.Slug, b.Slug, err)
			}
		}
	}
	return nil
}

func upsertAuthors(ctx context.Context, tx pgx.Tx, authors []author) (map[string]string, error) {
	ids := make(map[string]string, len(authors))
	for _, a := range authors {
		var id string
		if err := tx.QueryRow(ctx, `
			INSERT INTO authors (name, slug, bio)
			VALUES ($1, $2, NULLIF($3, ''))
			ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, bio = EXCLUDED.bio
			RETURNING id`,
			a.Name, a.Slug, a.Bio).Scan(&id); err != nil {
			return nil, fmt.Errorf("upsert author %q: %w", a.Slug, err)
		}
		ids[a.Slug] = id
	}
	return ids, nil
}

func upsertCategories(ctx context.Context, tx pgx.Tx, categories []category) (map[string]string, error) {
	ids := make(map[string]string, len(categories))
	for _, c := range categories {
		var id string
		if err := tx.QueryRow(ctx, `
			INSERT INTO categories (name, slug, description)
			VALUES ($1, $2, NULLIF($3, ''))
			ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
			RETURNING id`,
			c.Name, c.Slug, c.Description).Scan(&id); err != nil {
			return nil, fmt.Errorf("upsert category %q: %w", c.Slug, err)
		}
		ids[c.Slug] = id
	}
	return ids, nil
}

// upsertTopics: the topics table has no description column.
func upsertTopics(ctx context.Context, tx pgx.Tx, topics []topic) (map[string]string, error) {
	ids := make(map[string]string, len(topics))
	for _, t := range topics {
		var id string
		if err := tx.QueryRow(ctx, `
			INSERT INTO topics (name, slug)
			VALUES ($1, $2)
			ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
			RETURNING id`,
			t.Name, t.Slug).Scan(&id); err != nil {
			return nil, fmt.Errorf("upsert topic %q: %w", t.Slug, err)
		}
		ids[t.Slug] = id
	}
	return ids, nil
}

func upsertBook(ctx context.Context, tx pgx.Tx, b book) (string, error) {
	var id string
	if err := tx.QueryRow(ctx, `
		INSERT INTO books (title, slug, description, cover_url, level_id, source_url, license, publication_date)
		VALUES (
			$1, $2, $3, NULLIF($4, ''),
			(SELECT id FROM levels WHERE slug = $5),
			$6, NULLIF($7, ''), NULLIF($8, '')::date
		)
		ON CONFLICT (slug) DO UPDATE SET
			title = EXCLUDED.title,
			description = EXCLUDED.description,
			cover_url = EXCLUDED.cover_url,
			level_id = EXCLUDED.level_id,
			source_url = EXCLUDED.source_url,
			license = EXCLUDED.license,
			publication_date = EXCLUDED.publication_date,
			updated_at = NOW()
		RETURNING id`,
		b.Title, b.Slug, b.Description, b.CoverURL, b.Level, b.SourceURL, b.License, b.PublicationDate,
	).Scan(&id); err != nil {
		return "", fmt.Errorf("upsert book %q: %w", b.Slug, err)
	}
	return id, nil
}

// replaceAssociations clears and re-inserts a book's authors, categories and
// topics so entries removed from the data files are removed from the database
// on the next run.
func replaceAssociations(ctx context.Context, tx pgx.Tx, bookID string, b book, authorIDs, categoryIDs, topicIDs map[string]string) error {
	for _, stmt := range []string{
		"DELETE FROM book_authors WHERE book_id = $1",
		"DELETE FROM book_categories WHERE book_id = $1",
		"DELETE FROM book_topics WHERE book_id = $1",
	} {
		if _, err := tx.Exec(ctx, stmt, bookID); err != nil {
			return fmt.Errorf("clear associations for book %q: %w", b.Slug, err)
		}
	}

	for _, slug := range b.Authors {
		if _, err := tx.Exec(ctx, "INSERT INTO book_authors (book_id, author_id) VALUES ($1, $2)", bookID, authorIDs[slug]); err != nil {
			return fmt.Errorf("link author %q to book %q: %w", slug, b.Slug, err)
		}
	}
	for _, slug := range b.Categories {
		if _, err := tx.Exec(ctx, "INSERT INTO book_categories (book_id, category_id) VALUES ($1, $2)", bookID, categoryIDs[slug]); err != nil {
			return fmt.Errorf("link category %q to book %q: %w", slug, b.Slug, err)
		}
	}
	for _, slug := range b.Topics {
		if _, err := tx.Exec(ctx, "INSERT INTO book_topics (book_id, topic_id) VALUES ($1, $2)", bookID, topicIDs[slug]); err != nil {
			return fmt.Errorf("link topic %q to book %q: %w", slug, b.Slug, err)
		}
	}
	return nil
}

func printSummary(ctx context.Context, pool *pgxpool.Pool) error {
	fmt.Println("\nDatabase totals:")
	for _, table := range []string{"levels", "authors", "categories", "topics", "books", "chapters"} {
		var n int
		if err := pool.QueryRow(ctx, "SELECT count(*) FROM "+table).Scan(&n); err != nil {
			return fmt.Errorf("count %s: %w", table, err)
		}
		fmt.Printf("  %-11s %d\n", table+":", n)
	}
	fmt.Println("\nSeed complete.")
	return nil
}
