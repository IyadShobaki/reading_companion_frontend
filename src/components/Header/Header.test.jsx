/**
 * Header.test.jsx — Unit tests for the Header component.
 *
 * Covers:
 *   - Guest vs authenticated conditional nav items
 *   - Search form behaviour
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Header from "./Header";
import { CurrentUserContext } from "../../contexts/CurrentUserContext";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_USER = { _id: "u1", name: "Ada", email: "ada@example.com" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Captures the current location so tests can assert on navigation. */
function LocationDisplay() {
  const loc = useLocation();
  return <span data-testid="location">{loc.pathname + loc.search}</span>;
}

const renderHeader = ({
  currentUser = null,
  isLoggedIn = false,
  ...rest
} = {}) =>
  render(
    <CurrentUserContext.Provider value={{ currentUser }}>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <Header
                  handleLoginClick={vi.fn()}
                  handleRegisterClick={vi.fn()}
                  isLoggedIn={isLoggedIn}
                  {...rest}
                />
                <LocationDisplay />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </CurrentUserContext.Provider>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Header — guest vs authenticated nav", () => {
  // ── Guest ─────────────────────────────────────────────────────────────────

  it("shows Sign up and Log in buttons when the user is not logged in", () => {
    renderHeader({ isLoggedIn: false });
    expect(
      screen.getByRole("button", { name: /sign up/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("does not show My Library link for guests", () => {
    renderHeader({ isLoggedIn: false });
    expect(
      screen.queryByRole("link", { name: /my library/i }),
    ).not.toBeInTheDocument();
  });

  it("does not show a profile link for guests", () => {
    renderHeader({ isLoggedIn: false });
    // The profile area contains the username text — it should not be present
    expect(screen.queryByText("Ada")).not.toBeInTheDocument();
  });

  // ── Authenticated ─────────────────────────────────────────────────────────

  it("shows My Library link when the user is logged in", () => {
    renderHeader({ currentUser: MOCK_USER, isLoggedIn: true });
    expect(
      screen.getByRole("link", { name: /my library/i }),
    ).toBeInTheDocument();
  });

  it("shows the username in the nav when the user is logged in", () => {
    renderHeader({ currentUser: MOCK_USER, isLoggedIn: true });
    expect(screen.getByText("Ada")).toBeInTheDocument();
  });

  it("does not show Sign up or Log in buttons when logged in", () => {
    renderHeader({ currentUser: MOCK_USER, isLoggedIn: true });
    expect(
      screen.queryByRole("button", { name: /sign up/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /log in/i }),
    ).not.toBeInTheDocument();
  });

  it("shows a log out button when the user is logged in", () => {
    renderHeader({ currentUser: MOCK_USER, isLoggedIn: true });
    expect(
      screen.getByRole("button", { name: /log out/i }),
    ).toBeInTheDocument();
  });

  it("calls the logout handler from the authenticated nav", async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    renderHeader({ currentUser: MOCK_USER, isLoggedIn: true, onLogout });

    await user.click(screen.getByRole("button", { name: /log out/i }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});

describe("Header search", () => {
  it("renders the search input", () => {
    renderHeader();
    expect(
      screen.getByRole("searchbox", { name: /search books/i }),
    ).toBeInTheDocument();
  });

  it("renders the search submit button", () => {
    renderHeader();
    expect(
      screen.getByRole("button", { name: /submit search/i }),
    ).toBeInTheDocument();
  });

  it("navigates to /search?q=… when the form is submitted", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.type(screen.getByRole("searchbox"), "javascript");
    await user.click(screen.getByRole("button", { name: /submit search/i }));

    expect(screen.getByTestId("location").textContent).toBe(
      "/search?q=javascript",
    );
  });

  it("URL-encodes spaces in the search query", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.type(screen.getByRole("searchbox"), "clean code");
    await user.click(screen.getByRole("button", { name: /submit search/i }));

    expect(screen.getByTestId("location").textContent).toBe(
      "/search?q=clean%20code",
    );
  });

  it("does not navigate when the search query is empty", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: /submit search/i }));

    // Should still be on the original path
    expect(screen.getByTestId("location").textContent).toBe("/");
  });

  it("does not navigate when the search query is whitespace only", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.type(screen.getByRole("searchbox"), "   ");
    await user.click(screen.getByRole("button", { name: /submit search/i }));

    expect(screen.getByTestId("location").textContent).toBe("/");
  });

  it("submits the form when Enter is pressed in the search input", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.type(screen.getByRole("searchbox"), "react{Enter}");

    expect(screen.getByTestId("location").textContent).toBe("/search?q=react");
  });
});
