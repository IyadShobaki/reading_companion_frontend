/**
 * useAllNotes — fetch all notes for the authenticated user and group by book.
 *
 * Returns:
 *   - groupedNotes: Array of { googleBookId, notes[] } sorted by most
 *                   recently updated note in each group.
 *   - isLoading, error
 *   - refetch: re-fetch notes (e.g., after a delete from this view)
 */

import { useState, useEffect, useCallback } from "react";
import { notesService } from "../services/notes.service";

export function useAllNotes() {
  const [groupedNotes, setGroupedNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    notesService
      .getAllNotes()
      .then((notes) => {
        if (cancelled) return;

        // Group by googleBookId preserving server sort order (updatedAt desc)
        const map = new Map();
        for (const note of notes) {
          const key = note.googleBookId;
          if (!map.has(key)) {
            map.set(key, {
              googleBookId: key,
              bookTitle: note.bookTitle ?? null,
              notes: [],
            });
          }
          map.get(key).notes.push(note);
        }

        setGroupedNotes(Array.from(map.values()));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load notes.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cleanup = () => {};
    const timeoutId = setTimeout(() => {
      cleanup = load();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      cleanup();
    };
  }, [load]);

  return { groupedNotes, isLoading, error, refetch: load };
}
