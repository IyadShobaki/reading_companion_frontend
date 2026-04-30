# Reading Companion — Frontend

React single-page application for the Reading Companion project. Lets users discover books via the Google Books API, build a personal reading shelf, track reading progress page-by-page inside an embedded Google Books viewer, take per-book notes, and get AI-powered reading assistance through a Gemini-backed chat panel.

---

## Features

- **Book search** — Search the Google Books catalogue by title, author, or keyword. Results are displayed in a paginated grid with cover art, author, and a preview link.
- **Personal library** — Save books to a private shelf. Authenticated users' libraries persist on the backend; guest libraries are read-only.
- **Embedded reader** — Open any Google Books Preview directly inside the app. The Google Books Viewer is integrated via the JavaScript API.
- **Reading progress** — The current page is auto-saved to the backend and restored on the next visit.
- **Per-book notes** — Add, edit, and delete reading notes scoped to a specific book and page. Notes are stored on the backend and fetched when the reader opens.
- **AI reading assistant** _(stretch goal)_ — A panel inside the reader provides four Gemini-powered actions: Summarise, Explain, Context, and Ask — all scoped to the current book and page.
- **Authentication** — Register, log in, update profile (name + avatar), and log out. Session is restored across browser refreshes from a stored JWT.
- **Protected routing** — The `/profile` and `/library` routes redirect unauthenticated users to home. A spinner is shown while the session is being restored to prevent redirect flashes.
- **Error boundary** — An `ErrorBoundary` class component wraps the app root, catching unexpected render errors and showing a recoverable fallback UI.
- **Responsive BEM CSS** — All components use scoped BEM class names with CSS custom properties for consistent theming.

### Google Books availability note

The Google Books Viewer only supports books that Google has licensed for embedded preview (`viewability: "PARTIAL"` or `"ALL_PAGES"`). Books marked `"NO_PAGES"` or `"UNKNOWN"` cannot be read in-app — the reader shows an appropriate message in those cases.

---

## Tech Stack

| Technology                  | Version | Role                      |
| --------------------------- | ------- | ------------------------- |
| React                       | 19      | UI library                |
| React Router                | 7       | Client-side routing       |
| Vite                        | 8       | Build tool and dev server |
| CSS Custom Properties       | —       | Design token system       |
| Google Books JavaScript API | —       | Embedded viewer           |

**Testing:** Vitest · jsdom · @testing-library/react · @testing-library/user-event (398 tests, 39 files)

---

## Getting Started

### Prerequisites

- Node.js LTS
- The Reading Companion backend running on `http://localhost:3001`
- A Google Books API key (optional — search still works without one but may hit rate limits)

### Installation

```bash
# From the reading_companion_frontend directory
npm install
```

### Environment variables

Copy `.env.example` to `.env` and fill in the values:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_GOOGLE_BOOKS_API_KEY=your_google_books_api_key_here
```

> Only variables prefixed with `VITE_` are exposed to the browser build.

### Running

```bash
# Development (opens browser automatically)
npm run dev
```

App runs on `http://localhost:3000`.

### Tests

```bash
npm test
# watch mode
npm run test:watch
# with coverage
npm run test:coverage
```

### Build

```bash
npm run build
# Preview the production build locally
npm run preview
```

---

## Project Structure

```
reading_companion_frontend/src/
├── components/
│   ├── App/                    # Root — auth state, modal state, routing
│   ├── Header/                 # Navigation, search bar, auth buttons
│   ├── Footer/                 # Static footer
│   ├── Main/                   # Home / landing page
│   ├── Profile/                # Protected profile page with library and settings
│   ├── Library/                # Saved books grid
│   ├── Reader/                 # Embedded Google Books viewer + side panels
│   ├── NotesPanel/             # Per-book notes (add / edit / delete)
│   ├── NoteForm/               # Controlled note form with validation
│   ├── NoteCard/               # Single note display with inline edit
│   ├── AiPanel/                # Gemini AI reading assistant panel
│   ├── BookCard/               # Book thumbnail card
│   ├── BookGrid/               # Responsive book grid layout
│   ├── BookPreviewModal/       # Book details popup with save/remove
│   ├── BookSection/            # Labelled section containing a BookGrid
│   ├── SearchResults/          # Search results page
│   ├── ProtectedRoute/         # Route guard (loading → redirect → render)
│   ├── ConfirmationModal/      # Generic delete confirmation dialog
│   ├── LoginModal/             # Login form
│   ├── RegisterModal/          # Registration form
│   ├── UpdateProfileModal/     # Profile edit form
│   ├── ModalWithForm/          # Reusable accessible modal shell
│   ├── ErrorBoundary/          # Class component — catches render errors
│   ├── Loading/                # Spinner
│   ├── SideBar/                # Navigation sidebar
│   └── UserAvatar/             # Avatar image with fallback initials
├── hooks/
│   ├── useAuth.js              # Auth state: signin, signup, logout, restoreSession
│   ├── useModal.js             # Which modal is open
│   ├── useFormWithValidation.js # Values, real-time validation, isValid flag
│   ├── useLibrary.js           # Saved books state + CRUD
│   ├── useNotes.js             # Notes state + CRUD for one book
│   ├── useProgress.js          # Reading progress load + save
│   ├── useAiPanel.js           # AI panel request state
│   ├── useBookSection.js       # Book section data loading
│   ├── useDebounce.js          # Debounce utility hook
│   └── useGoogleBooksViewer.js # Google Books Viewer JS API integration
├── services/
│   ├── authService.js          # signup, signin, getCurrentUser, updateUser, logout
│   ├── library.service.js      # getAll, add, remove
│   ├── notes.service.js        # getByBook, create, update, remove
│   ├── progress.service.js     # get, save
│   ├── ai.service.js           # summarize, explain, context, ask
│   └── books.service.js        # Google Books API search + getById
├── utils/
│   ├── apiClient.js            # Fetch wrapper: auth headers, error.status, DEV logging
│   ├── tokenManager.js         # localStorage JWT abstraction (get/set/remove/exists)
│   └── progressStorage.js      # localStorage reading progress fallback
├── contexts/
│   └── CurrentUserContext.js   # currentUser React context
└── vendor/
    ├── normalize.css
    └── fonts.css
```

---

## Key Design Decisions

- **No external state library** — Auth, library, notes, and progress state live in custom hooks backed by Context API. Keeps the bundle small.
- **`error.status` on thrown errors** — `ApiClient` attaches the HTTP status code to every thrown error so hooks can distinguish 401 / 403 / network failures without string-matching.
- **`isLoading` starts `true`** — `useAuth.isLoading` begins as `true`, so `ProtectedRoute` shows a spinner during the initial session check instead of flashing a redirect.
- **Local notes hook** — `useNotes` is instantiated inside `NotesPanel` rather than lifted to `App`. Notes are scoped to a single open book and reset automatically on unmount.
- **Optimistic UI for notes and library** — State is updated immediately; the backend call runs concurrently. On failure, the previous state is rolled back.
- **CSS design tokens** — All colours, spacing, and radii are CSS custom properties defined in `:root`. Component stylesheets reference `var(--token-name)` only.
