/**
 * NotFound.test.jsx — Unit tests for the 404 page component.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotFound from "./NotFound";

const renderNotFound = () =>
  render(
    <MemoryRouter>
      <NotFound />
    </MemoryRouter>,
  );

describe("NotFound", () => {
  it("renders the 404 heading", () => {
    renderNotFound();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("404");
  });

  it("renders the friendly error message", () => {
    renderNotFound();
    expect(screen.getByText(/couldn't find that page/i)).toBeInTheDocument();
  });

  it("renders a link to the home page", () => {
    renderNotFound();
    const link = screen.getByRole("link", { name: /go back home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });
});
