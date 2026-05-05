import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchTMDBDetails, getDirectorName } from '@/lib/movieImport';

interface TMDBMovie {
  tmdb_id: number;
  title: string;
  description: string;
  poster_url: string | null;
  backdrop_url: string | null;
  release_date: string;
  rating: number;
  duration_minutes?: number;
  genre?: string[];
  director?: string | null;
  cast_members?: string[];
  trailer_key?: string | null;
  budget?: number;
  revenue?: number;
  original_language?: string;
  popularity?: number;
}

const SYNC_CACHE_KEY = 'movie_sync_timestamp_v4';
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

// Fetch full details concurrently in small batches so runtime / cast / director / genres are accurate
async function enrichWithDetails(movies: TMDBMovie[]): Promise<TMDBMovie[]> {
  const BATCH = 6;
  const out: TMDBMovie[] = [];
  for (let i = 0; i < movies.length; i += BATCH) {
    const slice = movies.slice(i, i + BATCH);
    const results = await Promise.all(
      slice.map(async (m) => {
        try {
          const d: any = await fetchTMDBDetails(m.tmdb_id);
          return {
            ...m,
            duration_minutes: d.duration_minutes ?? m.duration_minutes,
            genre: d.genre?.length ? d.genre : m.genre,
            director: typeof d.director === 'string' ? d.director : d.director?.name ?? m.director,
            cast_members: d.cast_members?.length ? d.cast_members : m.cast_members,
            trailer_key: d.trailer_key ?? m.trailer_key,
            budget: d.budget ?? m.budget,
            revenue: d.revenue ?? m.revenue,
            original_language: d.original_language ?? m.original_language,
            popularity: d.popularity ?? m.popularity,
          } as TMDBMovie;
        } catch {
          return m;
        }
      })
    );
    out.push(...results);
  }
  return out;
}

// Rotate which TMDB pages we pull daily so the catalogue refreshes naturally
const dailyPage = (max: number, offset = 0) => {
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return ((dayIndex + offset) % max) + 1;
};

export function useMovieSync() {
  const [syncing, setSyncing] = useState(false);
  const syncInProgress = useRef(false);

  const shouldSync = useCallback((): boolean => {
    try {
      const lastSync = localStorage.getItem(SYNC_CACHE_KEY);
      if (!lastSync) return true;
      
      const lastSyncTime = parseInt(lastSync, 10);
      const now = Date.now();
      return now - lastSyncTime > CACHE_DURATION;
    } catch {
      return true;
    }
  }, []);

  const markSynced = useCallback(() => {
    try {
      localStorage.setItem(SYNC_CACHE_KEY, Date.now().toString());
    } catch {
      // Ignore storage errors
    }
  }, []);

  const determineMovieStatus = (releaseDate: string | null): 'now_showing' | 'coming_soon' => {
    if (!releaseDate) return 'now_showing';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const release = new Date(releaseDate);
    release.setHours(0, 0, 0, 0);
    return release <= today ? 'now_showing' : 'coming_soon';
  };

  const batchUpsertMovies = async (movies: TMDBMovie[]) => {
    if (movies.length === 0) return;

    for (const movie of movies) {
      const movieData: any = {
        tmdb_id: movie.tmdb_id,
        title: movie.title,
        description: movie.description,
        poster_url: movie.poster_url,
        backdrop_url: movie.backdrop_url,
        release_date: movie.release_date,
        rating: movie.rating,
        duration_minutes: movie.duration_minutes || 120,
        genre: movie.genre || [],
        director: getDirectorName(movie.director as any),
        cast_members: movie.cast_members || [],
        budget: movie.budget || 0,
        revenue: movie.revenue || 0,
        original_language: movie.original_language || 'en',
        popularity: movie.popularity || 0,
        status: determineMovieStatus(movie.release_date),
      };
      const { error } = await supabase.rpc('import_movie_from_tmdb', {
        p_tmdb_id: movieData.tmdb_id,
        p_title: movieData.title,
        p_description: movieData.description,
        p_poster_url: movieData.poster_url,
        p_backdrop_url: movieData.backdrop_url,
        p_release_date: movieData.release_date,
        p_duration_minutes: movieData.duration_minutes,
        p_rating: movieData.rating,
        p_genre: movieData.genre,
        p_director: movieData.director,
        p_cast_members: movieData.cast_members,
        p_trailer_key: movie.trailer_key || null,
        p_status: movieData.status,
        p_budget: movieData.budget,
        p_revenue: movieData.revenue,
        p_original_language: movieData.original_language,
        p_popularity: movieData.popularity,
      });
      if (error) throw error;
    }
  };

  const syncMovies = useCallback(async (forceSync = false): Promise<boolean> => {
    // Prevent concurrent syncs
    if (syncInProgress.current) return false;
    
    // Check cache unless forced
    if (!forceSync && !shouldSync()) {
      return true;
    }

    syncInProgress.current = true;
    setSyncing(true);

    try {
      // Latest-release pages rotate every 4 days so the homepage feels fresh without changing constantly
      const latestReleasePage = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 4)) % 5 + 1;
      const nowPlayingPage = dailyPage(3, 1);
      const upcomingPage = dailyPage(5, 2);

      // Fetch high-confidence recent releases first, then supporting catalogue rows
      const [latestReleaseRes, nowPlayingRes, upcomingRes] = await Promise.all([
        fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-movies?action=latest_releases&page=${latestReleasePage}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        ),
        fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-movies?action=now_playing&page=${nowPlayingPage}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        ),
        fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-movies?action=upcoming&page=${upcomingPage}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        ),
      ]);

      if (!latestReleaseRes.ok || !nowPlayingRes.ok || !upcomingRes.ok) {
        console.warn('TMDB API returned error');
        return false;
      }

      const [latestReleaseData, nowPlayingData, upcomingData] = await Promise.all([
        latestReleaseRes.json(),
        nowPlayingRes.json(),
        upcomingRes.json(),
      ]);

      // Check for API errors
      if (latestReleaseData.error || nowPlayingData.error || upcomingData.error) {
        console.warn('TMDB API error:', latestReleaseData.error || nowPlayingData.error || upcomingData.error);
        return false;
      }

      const allMovies: TMDBMovie[] = [];

      if (latestReleaseData.movies?.length > 0) {
        allMovies.push(...latestReleaseData.movies.slice(0, 12));
      }

      // Add now playing movies as backup theatre inventory
      if (nowPlayingData.movies?.length > 0) {
        allMovies.push(...nowPlayingData.movies.slice(0, 8));
      }

      // Add upcoming movies (filter future dates, random 6)
      if (upcomingData.movies?.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const futureMovies = upcomingData.movies.filter((movie: TMDBMovie) => {
          if (!movie.release_date) return false;
          const releaseDate = new Date(movie.release_date);
          releaseDate.setHours(0, 0, 0, 0);
          return releaseDate > today;
        });
        
        const shuffled = futureMovies.sort(() => Math.random() - 0.5);
        allMovies.push(...shuffled.slice(0, 6));
      }

      // Batch upsert all movies at once
      await batchUpsertMovies(allMovies);
      
      // Auto-generate showtimes server-side (bypasses RLS)
      await supabase.rpc('generate_showtimes_for_movies');
      
      markSynced();
      return true;
    } catch (error) {
      console.error('Error syncing TMDB movies:', error);
      return false;
    } finally {
      setSyncing(false);
      syncInProgress.current = false;
    }
  }, [shouldSync, markSynced]);


  const clearCache = useCallback(() => {
    localStorage.removeItem(SYNC_CACHE_KEY);
  }, []);

  return {
    syncMovies,
    syncing,
    clearCache,
  };
}
