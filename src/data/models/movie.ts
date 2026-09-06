import type { Movie } from "@/types/database";

/**
 * Movie domain model.
 *
 * The raw row from the database is intentionally dumb: it stores facts only.
 * Everything derived (is this a new release? how long is it in "2h 14m"?
 * which decade?) is computed here, once, so no component re-implements it.
 */
export interface MovieView extends Movie {
  /** Release year, or null when the release date is unknown. */
  readonly year: number | null;
  /** Runtime formatted for display, e.g. "2h 14m". */
  readonly runtimeLabel: string;
  /** True when the movie is already out. */
  readonly isReleased: boolean;
  /** Released within the last 30 days. */
  readonly isNewRelease: boolean;
  /** Released within the last 120 days — used to boost catalogue ranking. */
  readonly isRecent: boolean;
  /** Rating rounded to one decimal, or null when unrated. */
  readonly ratingLabel: string | null;
  /** Primary genre, used for chips and grouping. */
  readonly primaryGenre: string | null;
  /** Ranking score: recency-weighted popularity. Higher sorts first. */
  readonly score: number;
}

export const DAY_MS = 86_400_000;
const NEW_RELEASE_DAYS = 30;
const RECENT_DAYS = 120;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const releaseTime = (movie: Movie): number | null => {
  if (!movie.release_date) return null;
  const d = new Date(movie.release_date);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const formatRuntime = (minutes?: number | null): string => {
  if (!minutes || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
};

/** Lift a raw row into the view model. Pure — safe to memoise. */
export function toMovieView(movie: Movie, now = startOfToday()): MovieView {
  const release = releaseTime(movie);
  const ageDays = release === null ? Infinity : (now - release) / DAY_MS;
  const isReleased = release === null ? true : release <= now;
  const isRecent = isReleased && ageDays <= RECENT_DAYS;
  const popularity = Number(movie.popularity || 0);
  const rating = movie.rating == null ? null : Number(movie.rating);

  return {
    ...movie,
    year: release === null ? null : new Date(release).getFullYear(),
    runtimeLabel: formatRuntime(movie.duration_minutes),
    isReleased,
    isNewRelease: isReleased && ageDays <= NEW_RELEASE_DAYS,
    isRecent,
    ratingLabel: rating && rating > 0 ? rating.toFixed(1) : null,
    primaryGenre: movie.genre?.[0] ?? null,
    score:
      (isRecent ? 10_000 : 0) +
      (release === null ? 0 : release / DAY_MS) +
      popularity,
  };
}

/** Freshest-first ordering used by the catalogue and the hero deck. */
export const byScoreDesc = (a: MovieView, b: MovieView) => b.score - a.score;

/** Soonest-first ordering for upcoming titles. */
export const byReleaseAsc = (a: MovieView, b: MovieView) =>
  (releaseTime(a) ?? Infinity) - (releaseTime(b) ?? Infinity);

export interface MovieCatalogue {
  /** Everything, ranked. */
  readonly all: MovieView[];
  /** Released titles, freshest first. */
  readonly nowShowing: MovieView[];
  /** Unreleased titles, soonest first. */
  readonly comingSoon: MovieView[];
  /** Top released titles that have artwork suitable for the hero. */
  readonly spotlight: MovieView[];
  /** Distinct genres present in the catalogue, most common first. */
  readonly genres: string[];
}

const SPOTLIGHT_SIZE = 6;

/** Build every derived slice of the catalogue in a single pass. */
export function buildCatalogue(rows: Movie[]): MovieCatalogue {
  const now = startOfToday();
  const all = rows.map((row) => toMovieView(row, now)).sort(byScoreDesc);

  const nowShowing = all.filter((m) => m.isReleased);
  const comingSoon = all.filter((m) => !m.isReleased).sort(byReleaseAsc);

  const spotlight = nowShowing
    .filter((m) => Boolean(m.backdrop_url))
    .slice(0, SPOTLIGHT_SIZE);

  const counts = new Map<string, number>();
  for (const movie of all) {
    for (const genre of movie.genre || []) {
      counts.set(genre, (counts.get(genre) || 0) + 1);
    }
  }
  const genres = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([genre]) => genre);

  return { all, nowShowing, comingSoon, spotlight, genres };
}

export const EMPTY_CATALOGUE: MovieCatalogue = {
  all: [],
  nowShowing: [],
  comingSoon: [],
  spotlight: [],
  genres: [],
};
