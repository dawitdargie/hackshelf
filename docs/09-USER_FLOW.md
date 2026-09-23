# HackShelf — User Flow

## 1. Unregistered User

The visitor opens HackShelf and lands on the Home page.

From the Home page, the visitor can:

- Browse all books
- Search for books
- Browse books by level
- Browse books by category or topic

The visitor selects a book and goes to the Book Details page.

On the Book Details page, the visitor can:

- View the book information
- View its level, category, topics, and author
- View ratings and reviews
- Read the book
- Attempt to save, rate, or review the book

If the visitor chooses Read, they enter the Reader and can read the book without registering.

If the visitor tries to Save, Rate, or Review, they are asked to Log in or Sign up.

## 2. Registered User

After signing up or logging in, the user can continue browsing books normally.

From a book's details page, the registered user can:

- Read the book
- Save the book
- Rate the book
- Write a review

While reading, the user can:

- Bookmark a location
- Add a bookmark note
- Track reading progress
- Continue reading later

The user's saved books, reading books, bookmarks, and progress are accessible through their Library.

## 3. Library Flow

The registered user opens My Library.

The Library contains:

- Saved Books
- Currently Reading
- Reading Progress
- Bookmarks

The user can select a saved or currently reading book and return directly to its Book Details or Reader.

## 4. Profile Flow

The registered user can open their Profile.

The profile contains basic account information and personal activity, such as:

- Username
- Email
- Saved book count
- Reading activity
- Review count

The user can also log out.

## 5. Admin Flow

Only users whose `role` is `admin` in the database can use this flow. Promotion is done directly in the database, then the user logs in (or refreshes) so the frontend refetches the profile with the new role.

1. The admin opens `/admin` (an Admin link appears in the header only for admins).
2. The admin panel lists all books with level, chapter count, and Edit/Delete actions.
3. **Create**: "New Book" opens the editor. The admin fills in metadata, picks a level, toggles or creates authors/categories/topics, adds chapters, previews a chapter's rendered Markdown, and saves. The book appears in the catalog immediately.
4. **Edit**: the pencil icon or Edit link loads the stored book into the same editor; changes reach the reader after saving.
5. **Delete**: the trash icon confirms, then the book and all related data are removed.

Non-admins who open `/admin` see an access denied card, and the backend rejects every admin API call with `403`.

## 6. Complete Flow in One Sentence

Visitor → Home → Browse/Search/Levels → Book Results → Book Details → Read

or

Visitor → Book Details → Save/Rate/Review → Login/Signup → Registered User → Save/Rate/Review → Reader → Bookmark/Track Progress → Library