import { supabase } from "@/integrations/supabase/client";
import { unwrapList, unwrapMaybe, sel } from "@/data/core/query";
import type { Movie } from "@/types/database";

const SCOPE = "movies";

/**
 * Explicit column list — never `select("*")`. Adding a column to the table
 * must not silently widen every payload the client downloads.
 */
const MOVIE_COLUMNS = sel(
  [
    "id",
    "tmdb_id",
    "title",
    "description",
    "poster_url",
    "backdrop_url",
    "duration_minutes",
    "rating",
    "genre",
    "cast_members",
    "director",
    "release_date",
    "status",
    "trailer_key",
    "budget",
    "revenue",
    "original_language",
    "popularity",
    "created_at",
    "updated_at",
  ].join(", "),
);

const CACHE_KEY = "cinebook_movies_cache_v3";
const CACHE_TTL_MS = 10 * 24 * 60 * 60 * 1000; // 10 days

interface CacheEnvelope {
  rows: Movie[];
  cachedAt: number;
}

/**
 * Offline-first catalogue cache. Session storage gives an instant paint on
 * repeat navigations; local storage survives a full reload for up to 10 days.
 */
export const moviesCache = {
  read(): Movie[] | null {
    try {
      const session = sessionStorage.getItem(CACHE_KEY);
      if (session) {
        const parsed = JSON.parse(session) as CacheEnvelope;
        if (parsed?.rows?.length) return parsed.rows;
      }
      const local = localStorage.getItem(CACHE_KEY);
      if (local) {
        const parsed = JSON.parse(local) as CacheEnvelope;
        if (parsed?.rows?.length && Date.now() - parsed.cachedAt < CACHE_TTL_MS)
          return parsed.rows;
      }
    } catch {
      /* storage unavailable or corrupt — treat as a cache miss */
    }
    return null;
  },
  write(rows: Movie[]) {
    try {
      const payload = JSON.stringify({
        rows,
        cachedAt: Date.now(),
      } satisfies CacheEnvelope);
      sessionStorage.setItem(CACHE_KEY, payload);
      localStorage.setItem(CACHE_KEY, payload);
    } catch {
      /* quota exceeded — the cache is an optimisation, not a requirement */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_KEY);
    } catch {
      /* nothing to do */
    }
  },
};

export const moviesRepository = {
  /** Full catalogue, ordered server-side so the first paint is already sane. */
  async list(): Promise<Movie[]> {
    const rows = await unwrapList<Movie>(
      SCOPE,
      supabase
        .from("movies")
        .select(MOVIE_COLUMNS)
        .order("popularity", { ascending: false })
        .order("release_date", { ascending: false, nullsFirst: false })
        .returns<Movie[]>(),
    );
    moviesCache.write(rows);
    return rows;
  },

  async byId(id: string): Promise<Movie | null> {
    return unwrapMaybe<Movie>(
      SCOPE,
      supabase
        .from("movies")
        .select(MOVIE_COLUMNS)
        .eq("id", id)
        .maybeSingle()
        .returns<Movie>(),
    );
  },

  async byTmdbId(tmdbId: number): Promise<Movie | null> {
    return unwrapMaybe<Movie>(
      SCOPE,
      supabase
        .from("movies")
        .select(MOVIE_COLUMNS)
        .eq("tmdb_id", tmdbId)
        .maybeSingle()
        .returns<Movie>(),
    );
  },

  /** Cached rows, if any — used to seed the query cache before the network. */
  cached(): Movie[] | null {
    return moviesCache.read();
  },
};
