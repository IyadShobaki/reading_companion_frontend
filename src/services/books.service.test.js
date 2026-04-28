/**
 * books.service.test.js — Unit tests for the Google Books service layer
 *
 * Tests are grouped into two suites:
 *   1. mapBookVolume — pure function, no I/O
 *   2. booksService — async functions, fetch is mocked
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mapBookVolume, booksService } from "./books.service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** A complete Google Books API volume object with all relevant fields. */
const FULL_VOLUME = {
  id: "abc123",
  volumeInfo: {
    title: "Clean Code",
    authors: ["Robert C. Martin"],
    description: "A handbook of agile software craftsmanship.",
    imageLinks: { thumbnail: "http://books.google.com/thumb.jpg" },
    categories: ["Computers"],
    language: "en",
    publishedDate: "2008-08-01",
  },
  accessInfo: {
    embeddable: true,
    viewability: "PARTIAL",
    publicDomain: false,
    webReaderLink: "http://play.google.com/books/reader?id=abc123",
  },
};

/** Minimal volume — only an id; no volumeInfo or accessInfo. */
const BARE_VOLUME = { id: "bare" };

/** A volume missing the id field entirely. */
const NO_ID_VOLUME = {
  volumeInfo: { title: "No ID Book" },
  accessInfo: {},
};

/** A single mock volume used in fetch-based tests. */
const MOCK_VOLUME = {
  id: "vol1",
  volumeInfo: { title: "Test Book", authors: ["Author A"] },
  accessInfo: {},
};

// ---------------------------------------------------------------------------
// 1. mapBookVolume
// ---------------------------------------------------------------------------

describe("mapBookVolume", () => {
  it("maps all fields from a full volume", () => {
    const book = mapBookVolume(FULL_VOLUME);

    expect(book.googleBookId).toBe("abc123");
    expect(book.title).toBe("Clean Code");
    expect(book.authors).toEqual(["Robert C. Martin"]);
    expect(book.description).toBe(
      "A handbook of agile software craftsmanship.",
    );
    expect(book.categories).toEqual(["Computers"]);
    expect(book.language).toBe("en");
    expect(book.publishedDate).toBe("2008-08-01");
    expect(book.embeddable).toBe(true);
    expect(book.viewability).toBe("PARTIAL");
    expect(book.publicDomain).toBe(false);
    expect(book.webReaderLink).toBe(
      "http://play.google.com/books/reader?id=abc123",
    );
  });

  it("upgrades http thumbnail to https to prevent mixed-content warnings", () => {
    const book = mapBookVolume(FULL_VOLUME);
    expect(book.thumbnail).toBe("https://books.google.com/thumb.jpg");
  });

  it("leaves https thumbnails unchanged", () => {
    const vol = {
      ...FULL_VOLUME,
      volumeInfo: {
        ...FULL_VOLUME.volumeInfo,
        imageLinks: { thumbnail: "https://books.google.com/already-https.jpg" },
      },
    };
    const book = mapBookVolume(vol);
    expect(book.thumbnail).toBe("https://books.google.com/already-https.jpg");
  });

  it("falls back to safe defaults when volumeInfo and accessInfo are absent", () => {
    const book = mapBookVolume(BARE_VOLUME);

    expect(book.googleBookId).toBe("bare");
    expect(book.title).toBe("Unknown Title");
    expect(book.authors).toEqual([]);
    expect(book.description).toBe("");
    expect(book.thumbnail).toBe("");
    expect(book.categories).toEqual([]);
    expect(book.language).toBe("");
    expect(book.publishedDate).toBe("");
    expect(book.embeddable).toBe(false);
    expect(book.viewability).toBe("NO_PAGES");
    expect(book.publicDomain).toBe(false);
    expect(book.webReaderLink).toBe("");
  });

  it("falls back to empty string when the volume has no id", () => {
    const book = mapBookVolume(NO_ID_VOLUME);
    expect(book.googleBookId).toBe("");
    expect(book.title).toBe("No ID Book");
  });

  it("falls back to empty string when imageLinks is absent", () => {
    const vol = {
      id: "no-img",
      volumeInfo: { title: "No Image" },
      accessInfo: {},
    };
    const book = mapBookVolume(vol);
    expect(book.thumbnail).toBe("");
  });
});

// ---------------------------------------------------------------------------
// 2. booksService — fetch-mocked tests
// ---------------------------------------------------------------------------

describe("booksService", () => {
  /** Reset all mocks between tests to prevent cross-test pollution. */
  beforeEach(() => {
    vi.resetAllMocks();
  });

  /** Builds a mocked fetch that resolves to the given JSON payload. */
  const mockFetchOk = (payload) =>
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });

  /** Builds a mocked fetch that resolves to a non-OK HTTP status. */
  const mockFetchError = (status) =>
    vi.fn().mockResolvedValue({ ok: false, status });

  // -------------------------------------------------------------------------
  // search
  // -------------------------------------------------------------------------

  describe("search", () => {
    it("calls the Google Books volumes endpoint", async () => {
      global.fetch = mockFetchOk({ items: [MOCK_VOLUME] });

      await booksService.search("javascript");

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain("googleapis.com/books/v1/volumes");
    });

    it("includes the query parameter in the URL", async () => {
      global.fetch = mockFetchOk({ items: [MOCK_VOLUME] });

      await booksService.search("clean code");

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain("q=clean+code");
    });

    it("applies the default maxResults of 20", async () => {
      global.fetch = mockFetchOk({ items: [] });

      await booksService.search("react");

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain("maxResults=20");
    });

    it("respects a custom maxResults option", async () => {
      global.fetch = mockFetchOk({ items: [] });

      await booksService.search("react", { maxResults: 5 });

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain("maxResults=5");
    });

    it("returns an array of mapped books", async () => {
      global.fetch = mockFetchOk({ items: [MOCK_VOLUME] });

      const results = await booksService.search("javascript");

      expect(results).toHaveLength(1);
      expect(results[0].googleBookId).toBe("vol1");
      expect(results[0].title).toBe("Test Book");
    });

    it("returns an empty array when the API response has no items", async () => {
      global.fetch = mockFetchOk({});

      const results = await booksService.search("nothing");

      expect(results).toEqual([]);
    });

    it("throws with the HTTP status on a non-ok response", async () => {
      global.fetch = mockFetchError(403);

      await expect(booksService.search("fail")).rejects.toThrow("403");
    });
  });

  // -------------------------------------------------------------------------
  // fetchSection
  // -------------------------------------------------------------------------

  describe("fetchSection", () => {
    it("calls the API with subject:fiction and orderBy=relevance for 'trending'", async () => {
      global.fetch = mockFetchOk({ items: [MOCK_VOLUME] });

      await booksService.fetchSection("trending");

      const calledUrl = fetch.mock.calls[0][0];
      // URL encoding: ":" becomes "%3A"
      expect(calledUrl).toContain("subject%3Afiction");
      expect(calledUrl).toContain("orderBy=relevance");
    });

    it("calls the API with orderBy=newest for 'new'", async () => {
      global.fetch = mockFetchOk({ items: [] });

      await booksService.fetchSection("new");

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain("orderBy=newest");
    });

    it("uses subject:philosophy for the 'philosophy' section", async () => {
      global.fetch = mockFetchOk({ items: [] });

      await booksService.fetchSection("philosophy");

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain("subject%3Aphilosophy");
    });

    it("uses subject:romance for the 'romance' section", async () => {
      global.fetch = mockFetchOk({ items: [] });

      await booksService.fetchSection("romance");

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain("subject%3Aromance");
    });

    it("uses subject:computers for the 'technology' section", async () => {
      global.fetch = mockFetchOk({ items: [] });

      await booksService.fetchSection("technology");

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain("subject%3Acomputers");
    });

    it("applies the default maxResults of 12", async () => {
      global.fetch = mockFetchOk({ items: [] });

      await booksService.fetchSection("trending");

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain("maxResults=12");
    });

    it("throws a descriptive error for an unknown section name", async () => {
      await expect(booksService.fetchSection("unknown")).rejects.toThrow(
        'Unknown book section: "unknown"',
      );
    });
  });

  // -------------------------------------------------------------------------
  // getById
  // -------------------------------------------------------------------------

  describe("getById", () => {
    it("calls the volumes endpoint with the book id in the path", async () => {
      global.fetch = mockFetchOk(MOCK_VOLUME);

      await booksService.getById("vol1");

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain("/volumes/vol1");
    });

    it("URL-encodes the book id to prevent path injection", async () => {
      global.fetch = mockFetchOk(MOCK_VOLUME);

      await booksService.getById("vol/with/slashes");

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain("vol%2Fwith%2Fslashes");
    });

    it("returns a single normalised book object", async () => {
      global.fetch = mockFetchOk(MOCK_VOLUME);

      const book = await booksService.getById("vol1");

      expect(book.googleBookId).toBe("vol1");
      expect(book.title).toBe("Test Book");
    });

    it("throws with the HTTP status on a non-ok response", async () => {
      global.fetch = mockFetchError(404);

      await expect(booksService.getById("missing")).rejects.toThrow("404");
    });
  });
});
