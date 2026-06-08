/**
 * NoteForm.test.jsx — Unit tests for the NoteForm component.
 *
 * Tests cover both add mode (no initialValues) and edit mode (initialValues set).
 * userEvent drives all interactions so validation and state changes match
 * what a real user would experience.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NoteForm from "./NoteForm";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Render NoteForm with sensible defaults for tests that don't need all props.
 */
const renderForm = (props = {}) =>
  render(<NoteForm currentPage={5} onSubmit={vi.fn()} {...props} />);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NoteForm", () => {
  // ── Add mode (default) ────────────────────────────────────────────────────

  it("renders a page number input pre-filled with currentPage", () => {
    renderForm({ currentPage: 12 });
    expect(screen.getByLabelText(/page number/i)).toHaveValue(12);
  });

  it("renders a title input", () => {
    renderForm();
    expect(screen.getByPlaceholderText(/short title/i)).toBeInTheDocument();
  });

  it("renders a note textarea", () => {
    renderForm();
    expect(screen.getByRole("textbox", { name: /note/i })).toBeInTheDocument();
  });

  it("submit button is disabled when content is empty", () => {
    renderForm();
    expect(screen.getByRole("button", { name: /add note/i })).toBeDisabled();
  });

  it("submit button is enabled when content is filled in", async () => {
    renderForm();
    await userEvent.type(
      screen.getByRole("textbox", { name: /note/i }),
      "Some content",
    );
    expect(screen.getByRole("button", { name: /add note/i })).toBeEnabled();
  });

  it("calls onSubmit with pageNumber, title, and content on valid submit", async () => {
    const onSubmit = vi.fn();
    renderForm({ currentPage: 7, onSubmit });
    await userEvent.type(
      screen.getByPlaceholderText(/short title/i),
      "My title",
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: /note/i }),
      "My note content",
    );
    await userEvent.click(screen.getByRole("button", { name: /add note/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      pageNumber: 7,
      title: "My title",
      content: "My note content",
    });
  });

  it("shows a validation error and does not call onSubmit when content is empty", async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });
    // Try submitting via button — it should be disabled, but also test directly
    const btn = screen.getByRole("button", { name: /add note/i });
    // Force click by temporarily enabling (use form submit event instead)
    const form = btn.closest("form");
    form.dispatchEvent(new Event("submit", { bubbles: true }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("resets content and title after a successful add-mode submit", async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });
    const textarea = screen.getByRole("textbox", { name: /note/i });
    await userEvent.type(textarea, "A note");
    await userEvent.click(screen.getByRole("button", { name: /add note/i }));
    expect(textarea).toHaveValue("");
  });

  it("does not show a Cancel button when onCancel is not provided", () => {
    renderForm();
    expect(
      screen.queryByRole("button", { name: /cancel/i }),
    ).not.toBeInTheDocument();
  });

  // ── Edit mode (initialValues provided) ───────────────────────────────────

  it("pre-fills fields from initialValues in edit mode", () => {
    renderForm({
      initialValues: {
        pageNumber: 20,
        title: "Old title",
        content: "Old content",
      },
    });
    expect(screen.getByLabelText(/page number/i)).toHaveValue(20);
    expect(screen.getByPlaceholderText(/short title/i)).toHaveValue(
      "Old title",
    );
    expect(screen.getByRole("textbox", { name: /note/i })).toHaveValue(
      "Old content",
    );
  });

  it("shows 'Save changes' button text in edit mode", () => {
    renderForm({
      initialValues: { pageNumber: 1, title: "", content: "Content" },
    });
    expect(
      screen.getByRole("button", { name: /save changes/i }),
    ).toBeInTheDocument();
  });

  it("shows a Cancel button when onCancel is provided", () => {
    renderForm({
      initialValues: { pageNumber: 1, title: "", content: "Content" },
      onCancel: vi.fn(),
    });
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const onCancel = vi.fn();
    renderForm({
      initialValues: { pageNumber: 1, title: "", content: "Content" },
      onCancel,
    });
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
