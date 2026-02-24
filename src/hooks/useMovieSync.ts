import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
}

const SYNC_CACHE_KEY = 'movie_sync_timestamp';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

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

    // Get existing movies by title to check for updates
    const titles = movies.map(m => m.title);
    const { data: existingMovies } = await supabase
      .from('movies')
      .select('id, title')
      .in('title', titles);

    const existingTitleMap = new Map(
      (existingMovies || []).map(m => [m.title.toLowerCase(), m.id])
    );

    const moviesToInsert: any[] = [];
    const moviesToUpdate: { id: string; data: any }[] = [];

    for (const movie of movies) {
      const existingId = existingTitleMap.get(movie.title.toLowerCase());
      const movieData = {
        title: movie.title,
        description: movie.description,
        poster_url: movie.poster_url,
        backdrop_url: movie.backdrop_url,
        release_date: movie.release_date,
        rating: movie.rating,
        duration_minutes: movie.duration_minutes || 120,
        genre: movie.genre || [],
        director: movie.director,
        cast_members: movie.cast_members || [],
        status: determineMovieStatus(movie.release_date),
      };

      if (existingId) {
        moviesToUpdate.push({ id: existingId, data: movieData });
      } else {
        moviesToInsert.push(movieData);
      }
    }

    // Batch insert new movies
    if (moviesToInsert.length > 0) {
      await supabase.from('movies').insert(moviesToInsert);
    }

    // Batch update existing movies (use Promise.all for parallel updates)
    if (moviesToUpdate.length > 0) {
      await Promise.all(
        moviesToUpdate.map(({ id, data }) =>
          supabase.from('movies').update(data).eq('id', id)
        )
      );
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
      // Get random pages for variety (between 1-5)
      const nowPlayingPage = Math.floor(Math.random() * 5) + 1;
      const upcomingPage = Math.floor(Math.random() * 5) + 1;

      // Fetch both endpoints in parallel
      const [nowPlayingRes, upcomingRes] = await Promise.all([
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

      if (!nowPlayingRes.ok || !upcomingRes.ok) {
        console.warn('TMDB API returned error');
        return false;
      }

      const [nowPlayingData, upcomingData] = await Promise.all([
        nowPlayingRes.json(),
        upcomingRes.json(),
      ]);

      // Check for API errors
      if (nowPlayingData.error || upcomingData.error) {
        console.warn('TMDB API error:', nowPlayingData.error || upcomingData.error);
        return false;
      }

      const allMovies: TMDBMovie[] = [];

      // Add now playing movies (random 8)
      if (nowPlayingData.movies?.length > 0) {
        const shuffled = [...nowPlayingData.movies].sort(() => Math.random() - 0.5);
        allMovies.push(...shuffled.slice(0, 8));
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
      
      // Auto-generate showtimes for movies that don't have future showtimes
      await generateMissingShowtimes();
      
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

  const generateMissingShowtimes = async () => {
    try {
      // Get all movies
      const { data: movies } = await supabase.from('movies').select('id');
      if (!movies || movies.length === 0) return;

      // Get screens
      const { data: screens } = await supabase.from('screens').select('id').limit(3);
      if (!screens || screens.length === 0) return;

      // Check which movies already have future showtimes
      const today = new Date().toISOString().split('T')[0];
      const { data: existingShowtimes } = await supabase
        .from('showtimes')
        .select('movie_id')
        .gte('show_date', today);

      const moviesWithShowtimes = new Set(
        (existingShowtimes || []).map(s => s.movie_id)
      );

      const moviesNeedingShowtimes = movies.filter(
        m => !moviesWithShowtimes.has(m.id)
      );

      if (moviesNeedingShowtimes.length === 0) return;

      const times = ['10:00', '13:30', '17:00', '20:30'];
      const showtimes: any[] = [];

      for (const movie of moviesNeedingShowtimes) {
        for (let day = 0; day < 7; day++) {
          const date = new Date();
          date.setDate(date.getDate() + day);
          const showDate = date.toISOString().split('T')[0];

          for (const screen of screens) {
            for (const time of times) {
              showtimes.push({
                movie_id: movie.id,
                screen_id: screen.id,
                show_date: showDate,
                show_time: time,
              });
            }
          }
        }
      }

      if (showtimes.length > 0) {
        // Insert in batches of 500
        for (let i = 0; i < showtimes.length; i += 500) {
          await supabase.from('showtimes').insert(showtimes.slice(i, i + 500));
        }
      }
    } catch (error) {
      console.error('Error generating showtimes:', error);
    }
  };

  const clearCache = useCallback(() => {
    localStorage.removeItem(SYNC_CACHE_KEY);
  }, []);

  return {
    syncMovies,
    syncing,
    clearCache,
  };
}
