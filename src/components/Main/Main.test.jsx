/**
 * Main.test.jsx — Unit tests for the Main component
 *
 * Main is a layout component that composes BookSection instances.
 * booksService is mocked so tests are fast and do not hit the network.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Main from "./Main";
import { booksService } from "../../services/books.service";

// ---------------------------------------------------------------------------
// Module mock — keeps all async section fetches from running during these tests
// ---------------------------------------------------------------------------

vi.mock("../../services/books.service", () => ({
  booksService: {
    fetchSection: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const renderMain = (props = {}) =>
  render(
    <MemoryRouter>
      <Main {...props} />
    </MemoryRouter>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Main", () => {
  beforeEach(() => {
    // Default: each section resolves immediately with no books
    booksService.fetchSection.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("renders all 5 section headings", () => {
    renderMain();
    expect(
      screen.getByRole("heading", { name: "Trending" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "New Books" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Philosophy" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Romance" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Technology" }),
    ).toBeInTheDocument();
  });

  it("renders 5 section loading indicators on initial mount", () => {
    // Keep all section promises pending so the loading state is visible
    booksService.fetchSection.mockReturnValue(new Promise(() => {}));
    renderMain();
    // One role="status" per section
    expect(screen.getAllByRole("status")).toHaveLength(5);
  });

  it("renders without crashing when no props are provided (uses safe defaults)", () => {
    expect(() => renderMain()).not.toThrow();
  });
});
