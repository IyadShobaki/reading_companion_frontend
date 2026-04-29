import { useState, useEffect, useRef, useCallback } from "react";
import { loadGoogleBooksApi } from "../utils/googleBooksLoader";

/**
 * useGoogleBooksViewer — manages the Google Books Embedded Viewer lifecycle.
 *
 * Loads the Google Books API script once (via loadGoogleBooksApi), then
 * initialises a viewer in the provided container element. Tracks viewer state
 * and current page number, and exposes page navigation helpers.
 *
 * Viewer states:
 *   "idle"        — no googleBookId provided
 *   "loading"     — API loading or viewer initialising
 *   "ready"       — viewer rendered successfully
 *   "failed"      — viewer or API load failed
 *   "unavailable" — book is not embeddable or has no viewable pages
 *
 * @param {Object} options
 * @param {string}                      options.googleBookId  - Google Books volume ID
 * @param {boolean}                     options.embeddable    - Whether the book can be embedded
 * @param {string}                      options.viewability   - Viewability status from the API
 * @param {React.RefObject<HTMLElement>} options.containerRef  - Viewer mount point
 *
 * @returns {{
 *   viewerState: "idle"|"loading"|"ready"|"failed"|"unavailable",
 *   currentPage: number,
 *   nextPage:    () => void,
 *   prevPage:    () => void,
 *   goToPage:    (page: number) => void,
 * }}
 */
export function useGoogleBooksViewer({
  googleBookId,
  embeddable,
  viewability,
  containerRef,
}) {
  const [viewerState, setViewerState] = useState("idle");
  const [currentPage, setCurrentPage] = useState(1);

  // Stable ref to the live DefaultViewer instance
  const viewerRef = useRef(null);

  const refreshPage = useCallback(() => {
    if (viewerRef.current) {
      setCurrentPage(viewerRef.current.getPageNumber() ?? 1);
    }
  }, []);

  const nextPage = useCallback(() => {
    if (viewerRef.current) {
      viewerRef.current.nextPage();
      refreshPage();
    }
  }, [refreshPage]);

  const prevPage = useCallback(() => {
    if (viewerRef.current) {
      viewerRef.current.previousPage(); // Google Books API method name
      refreshPage();
    }
  }, [refreshPage]);

  const goToPage = useCallback(
    (page) => {
      if (viewerRef.current) {
        viewerRef.current.goToPage(page);
        refreshPage();
      }
    },
    [refreshPage],
  );

  useEffect(() => {
    // No book selected
    if (!googleBookId) return;

    // Book exists but cannot be read in-app.
    if (!embeddable || viewability === "NO_PAGES") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewerState("unavailable");
      return;
    }

    // Container not yet in the DOM (can happen during fast navigation)
    if (!containerRef.current) return;

    let destroyed = false;
    setViewerState("loading");

    loadGoogleBooksApi()
      .then(() => {
        if (destroyed || !containerRef.current) return;

        const viewer = new window.google.books.DefaultViewer(
          containerRef.current,
        );
        viewerRef.current = viewer;

        viewer.load(
          googleBookId,
          // notFoundCallback (2nd param) — book could not be found or rendered
          () => {
            if (!destroyed) {
              setViewerState("failed");
            }
          },
          // successCallback (3rd param) — viewer is ready and pages are visible
          () => {
            if (!destroyed) {
              setViewerState("ready");
              setCurrentPage(viewer.getPageNumber() ?? 1);
            }
          },
        );
      })
      .catch(() => {
        if (!destroyed) {
          setViewerState("failed");
        }
      });

    return () => {
      destroyed = true;
      viewerRef.current = null;
    };
  }, [googleBookId, embeddable, viewability, containerRef]);

  return { viewerState, currentPage, nextPage, prevPage, goToPage };
}
