# Reading Companion - Frontend

React single-page application for Reading Companion. The frontend lets users discover books through Google Books, preview and read embeddable books, manage a saved library, save reading progress, write per-book notes, and use an OpenAI-backed AI assistant in the reader.

## Features

- **Book discovery and search** - Search by title, author, or keyword and render normalized Google Books results.
- **Home sections** - Cached category sections for repeated browsing without unnecessary API calls.
- **Book preview modal** - Detailed metadata, availability status, and library actions.
- **Embedded reader** - In-app Google Books iframe reader with page navigation and non-viewable fallback states.
- **Progress tracking** - Guests use localStorage; authenticated users load from the backend first and keep a local mirror.
- **Personal library** - Authenticated users can add/remove saved books through the backend API.
- **Notes** - Authenticated users can create, edit, delete, sort, expand, and collapse notes per book/page.
- **AI assistant** - Authenticated users can summarize, explain, request context, and ask questions through backend `/ai/*` endpoints.
- **Authentication** - Register, sign in, restore a JWT-backed session, update profile data, and log out.
- **Resilience** - Loading, empty, error, and fallback states plus an app-level `ErrorBoundary`.

## Google Books Availability

Google controls which books can be embedded. Books with no embeddable preview or no viewable pages are still searchable, but the reader shows a clear fallback instead of attempting to render unavailable content.

## Tech Stack

| Technology                 | Role                      |
| -------------------------- | ------------------------- |
| React 19                   | UI library                |
| React Router 7             | Client-side routing       |
| Vite 8                     | Build tool and dev server |
| Vanilla CSS with BEM       | Component styling         |
| Google Books API           | Discovery data            |
| Google Books iframe embed  | In-app reading            |
| Vitest and Testing Library | Frontend tests            |

Current documented test baseline: 42 Vitest files, 405 tests.

## Setup

```bash
npm install
```

Create `.env` from `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_GOOGLE_BOOKS_API_KEY=your_google_books_api_key_here
```

`VITE_GOOGLE_BOOKS_API_KEY` is optional for local development but recommended to avoid rate-limit friction.

## Commands

```bash
npm run dev
npm test
npm run test:coverage
npm run lint
npm run build
npm run preview
```

The dev server runs on `http://localhost:3000`.

## Project Structure

```text
reading_companion_frontend/
  index.html
  vite.config.js
  src/
    assets/          Static images and fonts
    components/      Feature and UI components
    contexts/        Current user and library contexts
    hooks/           Auth, modal, form, library, notes, progress, AI, and books hooks
    services/        API clients for auth, books, library, notes, progress, and AI
    utils/           ApiClient, token manager, progress storage, and book cache
    vendor/          normalize.css and font CSS
```

## Key Design Decisions

- Custom hooks and React Context handle app state instead of an external state library.
- Service modules isolate all backend and third-party API calls.
- `ApiClient` injects auth headers, handles `204 No Content`, unwraps response envelopes, and attaches `error.status`.
- Library and notes use optimistic updates with rollback on request failure.
- Authenticated progress checks the backend first for cross-device resume, then falls back to localStorage on API failure.
- CSS uses BEM class names and design tokens from `App.css`.
