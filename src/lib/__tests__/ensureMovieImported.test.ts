import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const rpc = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: (...a: unknown[]) => rpc(...a) },
}));

import { ensureMovieImported } from "@/lib/movieImport";

const fullMovie = {
  tmdb_id: 55,
  title: "Interstellar",
  duration_minutes: 169,
  genre: ["Sci-Fi"],
  release_date: "2014-11-05",
  director: { name: "Christopher Nolan" },
  cast_details: [{ name: "Matthew McConaughey" }],
};

beforeEach(() => {
  rpc.mockReset();
  rpc.mockResolvedValue({ data: "movie-uuid", error: null });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ensureMovieImported", () => {
  it("imports an already-detailed movie without extra fetches and generates showtimes", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(ensureMovieImported(fullMovie)).resolves.toBe("movie-uuid");

    expect(fetchSpy).not.toHaveBeenCalled();
    const [fnName, args] = rpc.mock.calls[0];
    expect(fnName).toBe("import_movie_from_tmdb");
    expect(args).toMatchObject({
      p_tmdb_id: 55,
      p_duration_minutes: 169,
      p_director: "Christopher Nolan",
      p_cast_members: ["Matthew McConaughey"],
      p_status: "now_showing",
    });
    expect(rpc.mock.calls[1][0]).toBe("generate_showtimes_for_movie");
  });

  it("fetches details when given a bare tmdb id and honors generateShowtimes: false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => fullMovie }),
    );

    await ensureMovieImported(55, { generateShowtimes: false });

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc.mock.calls[0][0]).toBe("import_movie_from_tmdb");
  });

  it("enriches a partial movie and applies fallback defaults", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ tmdb_id: 9, title: "Sparse" }),
      }),
    );

    await ensureMovieImported(
      { tmdb_id: 9, title: "Sparse" },
      { status: "coming_soon" },
    );

    expect(rpc.mock.calls[0][1]).toMatchObject({
      p_duration_minutes: 120,
      p_original_language: "en",
      p_status: "coming_soon",
      p_cast_members: [],
      p_budget: 0,
    });
    // coming_soon never triggers showtime generation
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("throws when the import RPC fails", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: new Error("rpc down") });
    await expect(ensureMovieImported(fullMovie)).rejects.toThrow("rpc down");
  });
});
