import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isUuid,
  getDirectorName,
  determineMovieStatus,
  fetchTMDBDetails,
  resolveTMDBMovieId,
} from "@/lib/movieImport";

const mockFetch = (payload: unknown, ok = true) =>
  vi.fn().mockResolvedValue({ ok, json: async () => payload });

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch({}));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("isUuid", () => {
  it("accepts a v4 uuid", () => {
    expect(isUuid("f47ac10b-58cc-4372-a567-0e02b2c3d479")).toBe(true);
  });
  it("rejects numeric ids and junk", () => {
    expect(isUuid("12345")).toBe(false);
    expect(isUuid("not-a-uuid")).toBe(false);
  });
});

describe("getDirectorName", () => {
  it("handles strings, objects and nullish", () => {
    expect(getDirectorName("Nolan")).toBe("Nolan");
    expect(getDirectorName({ name: "Villeneuve" })).toBe("Villeneuve");
    expect(getDirectorName(null)).toBeNull();
    expect(getDirectorName({})).toBeNull();
  });
});

describe("determineMovieStatus", () => {
  it("defaults to now_showing when no date", () => {
    expect(determineMovieStatus(null)).toBe("now_showing");
  });
  it("marks past releases as now_showing", () => {
    expect(determineMovieStatus("2000-01-01")).toBe("now_showing");
  });
  it("marks future releases as coming_soon", () => {
    const future = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    expect(determineMovieStatus(future)).toBe("coming_soon");
  });
  it("treats today as released", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(determineMovieStatus(today)).toBe("now_showing");
  });
});

describe("fetchTMDBDetails", () => {
  it("returns parsed json on success", async () => {
    vi.stubGlobal("fetch", mockFetch({ tmdb_id: 42, title: "Dune" }));
    await expect(fetchTMDBDetails(42)).resolves.toEqual({
      tmdb_id: 42,
      title: "Dune",
    });
  });
  it("throws on a failed response", async () => {
    vi.stubGlobal("fetch", mockFetch({}, false));
    await expect(fetchTMDBDetails(1)).rejects.toThrow(
      "Failed to fetch TMDB details",
    );
  });
});

describe("resolveTMDBMovieId", () => {
  it("short-circuits when a tmdbId is already known", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    await expect(resolveTMDBMovieId({ tmdbId: 7, title: "X" })).resolves.toBe(
      7,
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns null when the search request fails", async () => {
    vi.stubGlobal("fetch", mockFetch({}, false));
    await expect(resolveTMDBMovieId({ title: "Ghost" })).resolves.toBeNull();
  });

  it("returns null when there are no results", async () => {
    vi.stubGlobal("fetch", mockFetch({ movies: [] }));
    await expect(resolveTMDBMovieId({ title: "Ghost" })).resolves.toBeNull();
  });

  it("prefers an exact poster match", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        movies: [
          { tmdb_id: 1, title: "Other", poster_url: "b.jpg" },
          { tmdb_id: 2, title: "Wrong", poster_url: "a.jpg" },
        ],
      }),
    );
    await expect(
      resolveTMDBMovieId({ title: "Whatever", posterUrl: "a.jpg" }),
    ).resolves.toBe(2);
  });

  it("falls back to exact title + release date, then year, then title", async () => {
    const movies = [
      { tmdb_id: 10, title: "The Batman", release_date: "2004-03-04" },
      { tmdb_id: 11, title: "The Batman", release_date: "2022-03-04" },
    ];
    vi.stubGlobal("fetch", mockFetch({ movies }));
    await expect(
      resolveTMDBMovieId({ title: "the batman!", releaseDate: "2022-03-04" }),
    ).resolves.toBe(11);

    vi.stubGlobal("fetch", mockFetch({ movies }));
    await expect(
      resolveTMDBMovieId({ title: "The Batman", releaseDate: "2022-01-01" }),
    ).resolves.toBe(11);

    vi.stubGlobal("fetch", mockFetch({ movies }));
    await expect(resolveTMDBMovieId({ title: "The Batman" })).resolves.toBe(10);
  });

  it("falls back to the first result when nothing matches", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ movies: [{ tmdb_id: 99, title: "Zzz" }] }),
    );
    await expect(resolveTMDBMovieId({ title: "Nope" })).resolves.toBe(99);
  });
});
