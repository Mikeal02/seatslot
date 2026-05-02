import { supabase } from '@/integrations/supabase/client';

export interface TMDBMoviePayload {
  tmdb_id: number;
  title: string;
  description?: string | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  release_date?: string | null;
  rating?: number | null;
  duration_minutes?: number | null;
  genre?: string[] | null;
  director?: string | { name?: string | null } | null;
  cast_members?: string[] | null;
  cast_details?: { name: string }[] | null;
  trailer_key?: string | null;
  budget?: number | null;
  revenue?: number | null;
  original_language?: string | null;
  popularity?: number | null;
}

export const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const tmdbHeaders = {
  'Content-Type': 'application/json',
  apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
};

const normalizeTitle = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export const getDirectorName = (director: TMDBMoviePayload['director']) =>
  typeof director === 'string' ? director : director?.name ?? null;

export const determineMovieStatus = (releaseDate?: string | null): 'now_showing' | 'coming_soon' => {
  if (!releaseDate) return 'now_showing';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const release = new Date(releaseDate);
  release.setHours(0, 0, 0, 0);
  return release <= today ? 'now_showing' : 'coming_soon';
};

export async function fetchTMDBDetails(tmdbId: number): Promise<TMDBMoviePayload> {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-movies?action=details&movie_id=${tmdbId}`,
    { headers: tmdbHeaders }
  );
  if (!res.ok) throw new Error('Failed to fetch TMDB details');
  return res.json();
}

export async function resolveTMDBMovieId(input: {
  tmdbId?: number | null;
  title: string;
  releaseDate?: string | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
}): Promise<number | null> {
  if (input.tmdbId) return input.tmdbId;

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-movies?action=search&query=${encodeURIComponent(input.title)}`,
    { headers: tmdbHeaders }
  );
  if (!res.ok) return null;

  const data = await res.json();
  const movies: TMDBMoviePayload[] = data.movies || [];
  if (movies.length === 0) return null;

  const wantedTitle = normalizeTitle(input.title);
  const wantedDate = input.releaseDate || null;
  const wantedYear = wantedDate?.slice(0, 4) || null;

  const exactPoster = movies.find((m) => m.poster_url && input.posterUrl && m.poster_url === input.posterUrl);
  const exactBackdrop = movies.find((m) => m.backdrop_url && input.backdropUrl && m.backdrop_url === input.backdropUrl);
  const exactDate = movies.find((m) => normalizeTitle(m.title) === wantedTitle && m.release_date === wantedDate);
  const exactYear = movies.find((m) => normalizeTitle(m.title) === wantedTitle && m.release_date?.slice(0, 4) === wantedYear);
  const exactTitle = movies.find((m) => normalizeTitle(m.title) === wantedTitle);

  return (exactPoster || exactBackdrop || exactDate || exactYear || exactTitle || movies[0]).tmdb_id;
}

export async function ensureMovieImported(
  tmdbMovieOrId: TMDBMoviePayload | number,
  options: { status?: 'now_showing' | 'coming_soon'; generateShowtimes?: boolean } = {}
) {
  const movie = typeof tmdbMovieOrId === 'number'
    ? await fetchTMDBDetails(tmdbMovieOrId)
    : tmdbMovieOrId.duration_minutes && tmdbMovieOrId.genre?.length
      ? tmdbMovieOrId
      : await fetchTMDBDetails(tmdbMovieOrId.tmdb_id);

  const status = options.status ?? determineMovieStatus(movie.release_date);
  const castMembers = movie.cast_members?.length
    ? movie.cast_members
    : movie.cast_details?.map((cast) => cast.name).slice(0, 20) || [];

  const { data: movieId, error } = await supabase.rpc('import_movie_from_tmdb', {
    p_tmdb_id: movie.tmdb_id,
    p_title: movie.title,
    p_description: movie.description || null,
    p_poster_url: movie.poster_url || null,
    p_backdrop_url: movie.backdrop_url || null,
    p_release_date: movie.release_date || null,
    p_duration_minutes: movie.duration_minutes || 120,
    p_rating: movie.rating || null,
    p_genre: movie.genre || [],
    p_director: getDirectorName(movie.director),
    p_cast_members: castMembers,
    p_trailer_key: movie.trailer_key || null,
    p_status: status,
  });

  if (error) throw error;

  if (options.generateShowtimes !== false && status === 'now_showing') {
    await supabase.rpc('generate_showtimes_for_movies');
  }

  return movieId;
}