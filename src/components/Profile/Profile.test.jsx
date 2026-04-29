/**
 * Profile.test.jsx — Unit tests for the Profile page component
 *
 * Profile reads from two contexts:
 *   - CurrentUserContext  → user name and avatar (consumed inside SideBar)
 *   - LibraryContext      → savedBooks array for the stats panel
 *
 * Both are injected via Providers so tests remain independent of any hook
 * or service implementation.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Profile from "./Profile";
import { CurrentUserContext } from "../../contexts/CurrentUserContext";
import { LibraryContext } from "../../contexts/LibraryContext";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_USER = {
  _id: "u1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  avatar: "https://example.com/avatar.jpg",
};

const MOCK_BOOKS = [
  { googleBookId: "b1", title: "Book One" },
  { googleBookId: "b2", title: "Book Two" },
];

// Default context value shape matching LibraryContext defaults
const DEFAULT_LIBRARY = {
  savedBooks: [],
  savedBookIds: [],
  isLoading: false,
  error: null,
  fetchLibrary: vi.fn(),
  addBook: vi.fn(),
  removeBook: vi.fn(),
  clearLibrary: vi.fn(),
};

/**
 * Render Profile with controllable context values.
 *
 * @param {Object} [opts]
 * @param {Object} [opts.currentUser]    - Value for CurrentUserContext
 * @param {Array}  [opts.savedBooks]     - savedBooks for LibraryContext
 * @param {Function} [opts.onLogout]     - Logout callback spy
 * @param {Function} [opts.onOpenUpdateModal] - Edit profile callback spy
 */
function renderProfile({
  currentUser = MOCK_USER,
  savedBooks = [],
  onLogout = vi.fn(),
  onOpenUpdateModal = vi.fn(),
} = {}) {
  return render(
    <MemoryRouter>
      <CurrentUserContext.Provider value={{ currentUser }}>
        <LibraryContext.Provider value={{ ...DEFAULT_LIBRARY, savedBooks }}>
          <Profile onLogout={onLogout} onOpenUpdateModal={onOpenUpdateModal} />
        </LibraryContext.Provider>
      </CurrentUserContext.Provider>
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Profile", () => {
  // ── Sidebar — user identity ───────────────────────────────────────────────

  it("renders the user's name in the sidebar", () => {
    renderProfile();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("renders the user's avatar image when an avatar URL is set", () => {
    renderProfile();
    expect(screen.getByRole("img", { name: /Ada Lovelace/i })).toHaveAttribute(
      "src",
      MOCK_USER.avatar,
    );
  });

  it("renders the initial-letter fallback when no avatar URL is set", () => {
    renderProfile({ currentUser: { ...MOCK_USER, avatar: "" } });
    // UserAvatar renders a <span> with the first letter of the name
    expect(screen.getByLabelText(/Ada Lovelace/i)).toHaveTextContent("A");
  });

  // ── Sidebar — actions ────────────────────────────────────────────────────

  it("calls onOpenUpdateModal when 'Change profile data' is clicked", async () => {
    const onOpenUpdateModal = vi.fn();
    renderProfile({ onOpenUpdateModal });
    await userEvent.click(
      screen.getByRole("button", { name: /change profile data/i }),
    );
    expect(onOpenUpdateModal).toHaveBeenCalledOnce();
  });

  it("calls onLogout when 'Log out' is clicked", async () => {
    const onLogout = vi.fn();
    renderProfile({ onLogout });
    await userEvent.click(screen.getByRole("button", { name: /log out/i }));
    expect(onLogout).toHaveBeenCalledOnce();
  });

  // ── Stats panel ───────────────────────────────────────────────────────────

  it("shows 0 when there are no saved books", () => {
    renderProfile({ savedBooks: [] });
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText(/books saved/i)).toBeInTheDocument();
  });

  it("shows the correct count when there are saved books", () => {
    renderProfile({ savedBooks: MOCK_BOOKS });
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  // ── Library link ──────────────────────────────────────────────────────────

  it("renders a link to /library", () => {
    renderProfile();
    const link = screen.getByRole("link", { name: /view my library/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/library");
  });

  // ── Reading stats region ──────────────────────────────────────────────────

  it("renders the reading stats region with accessible label", () => {
    renderProfile();
    expect(
      screen.getByRole("region", { name: /reading stats/i }),
    ).toBeInTheDocument();
  });
});
