/**
 * NoteCard.test.jsx — Unit tests for the NoteCard component.
 *
 * Covers note rendering, expand/collapse for long content, inline edit mode,
 * and delete callback forwarding.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NoteCard from "./NoteCard";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SHORT_NOTE = {
  _id: "note-1",
  googleBookId: "book1",
  pageNumber: 12,
  title: "Key insight",
  content: "Short content.",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

// Content exactly over the 200-char truncation threshold
const LONG_CONTENT = "A".repeat(201);
const LONG_NOTE = {
  ...SHORT_NOTE,
  _id: "note-long",
  title: "",
  content: LONG_CONTENT,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NoteCard", () => {
  // ── Rendering ─────────────────────────────────────────────────────────────

  it("renders the page number", () => {
    render(<NoteCard note={SHORT_NOTE} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/p\.12/i)).toBeInTheDocument();
  });

  it("renders the title when present", () => {
    render(<NoteCard note={SHORT_NOTE} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(
      screen.getByRole("heading", { name: "Key insight" }),
    ).toBeInTheDocument();
  });

  it("does not render a heading when title is empty", () => {
    render(
      <NoteCard
        note={{ ...SHORT_NOTE, title: "" }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("renders the note content", () => {
    render(<NoteCard note={SHORT_NOTE} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Short content.")).toBeInTheDocument();
  });

  // ── Expand / collapse ─────────────────────────────────────────────────────

  it("does not show a Show more button when content is short", () => {
    render(<NoteCard note={SHORT_NOTE} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(
      screen.queryByRole("button", { name: /show more/i }),
    ).not.toBeInTheDocument();
  });

  it("shows a Show more button when content exceeds the threshold", () => {
    render(<NoteCard note={LONG_NOTE} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /show more/i }),
    ).toBeInTheDocument();
  });

  it("expands and collapses content when the toggle is clicked", async () => {
    render(<NoteCard note={LONG_NOTE} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const toggle = screen.getByRole("button", { name: /show more/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);
    expect(
      screen.getByRole("button", { name: /show less/i }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /show less/i }));
    expect(
      screen.getByRole("button", { name: /show more/i }),
    ).toBeInTheDocument();
  });

  // ── Delete ────────────────────────────────────────────────────────────────

  it("calls onDelete with the note _id when Delete is clicked", async () => {
    const onDelete = vi.fn();
    render(<NoteCard note={SHORT_NOTE} onEdit={vi.fn()} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: /delete note/i }));
    expect(onDelete).toHaveBeenCalledWith(SHORT_NOTE._id);
  });

  // ── Edit mode ─────────────────────────────────────────────────────────────

  it("shows an inline edit form when Edit is clicked", async () => {
    render(<NoteCard note={SHORT_NOTE} onEdit={vi.fn()} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /edit note/i }));
    expect(
      screen.getByRole("form", { name: /edit note/i }),
    ).toBeInTheDocument();
  });

  it("calls onEdit with the noteId and changes when the edit form is submitted", async () => {
    const onEdit = vi.fn();
    render(<NoteCard note={SHORT_NOTE} onEdit={onEdit} onDelete={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /edit note/i }));

    // Clear content and type a new value
    const textarea = screen.getByRole("textbox", { name: /note/i });
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "Updated content");

    await userEvent.click(
      screen.getByRole("button", { name: /save changes/i }),
    );

    expect(onEdit).toHaveBeenCalledWith(
      SHORT_NOTE._id,
      expect.objectContaining({ content: "Updated content" }),
    );
  });

  it("exits edit mode and shows the note when Cancel is clicked", async () => {
    render(<NoteCard note={SHORT_NOTE} onEdit={vi.fn()} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /edit note/i }));
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    // Should be back to normal card view
    expect(screen.getByText("Short content.")).toBeInTheDocument();
    expect(
      screen.queryByRole("form", { name: /edit note/i }),
    ).not.toBeInTheDocument();
  });
});
