import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getDirectorName } from '@/lib/movieImport';

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
}

interface TMDBResponse {
  movies?: TMDBMovie[];
  total_pages?: number;
  page?: number;
}

export function useTMDB() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFromTMDB = async (
    action: 'now_playing' | 'upcoming' | 'popular' | 'details' | 'search',
    params?: { movieId?: string; query?: string; page?: number }
  ): Promise<TMDBResponse | TMDBMovie | null> => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams({ action });
      if (params?.movieId) searchParams.set('movie_id', params.movieId);
      if (params?.query) searchParams.set('query', params.query);
      if (params?.page) searchParams.set('page', String(params.page));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-movies?${searchParams.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch from TMDB');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('TMDB fetch error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const syncMovieFromTMDB = async (tmdbMovie: TMDBMovie, status: 'now_showing' | 'coming_soon') => {
    try {
      // Check if movie already exists
      const { data: existing } = await supabase
        .from('movies')
        .select('id')
        .ilike('title', tmdbMovie.title)
        .maybeSingle();

      if (existing) {
        // Update existing movie
        const { error } = await supabase
          .from('movies')
          .update({
            tmdb_id: tmdbMovie.tmdb_id,
            description: tmdbMovie.description,
            poster_url: tmdbMovie.poster_url,
            backdrop_url: tmdbMovie.backdrop_url,
            release_date: tmdbMovie.release_date,
            rating: tmdbMovie.rating,
            duration_minutes: tmdbMovie.duration_minutes || 120,
            genre: tmdbMovie.genre || [],
            director: getDirectorName(tmdbMovie.director as any),
            cast_members: tmdbMovie.cast_members || [],
            status,
          })
          .eq('id', existing.id);

        if (error) throw error;
        return existing.id;
      } else {
        // Insert new movie
        const { data, error } = await supabase
          .from('movies')
          .insert({
            tmdb_id: tmdbMovie.tmdb_id,
            title: tmdbMovie.title,
            description: tmdbMovie.description,
            poster_url: tmdbMovie.poster_url,
            backdrop_url: tmdbMovie.backdrop_url,
            release_date: tmdbMovie.release_date,
            rating: tmdbMovie.rating,
            duration_minutes: tmdbMovie.duration_minutes || 120,
            genre: tmdbMovie.genre || [],
            director: getDirectorName(tmdbMovie.director as any),
            cast_members: tmdbMovie.cast_members || [],
            status,
          })
          .select('id')
          .single();

        if (error) throw error;
        return data.id;
      }
    } catch (err) {
      console.error('Error syncing movie:', err);
      throw err;
    }
  };

  return {
    loading,
    error,
    fetchNowPlaying: (page?: number) => fetchFromTMDB('now_playing', { page }),
    fetchUpcoming: (page?: number) => fetchFromTMDB('upcoming', { page }),
    fetchPopular: (page?: number) => fetchFromTMDB('popular', { page }),
    fetchDetails: (movieId: string) => fetchFromTMDB('details', { movieId }),
    searchMovies: (query: string, page?: number) => fetchFromTMDB('search', { query, page }),
    syncMovieFromTMDB,
  };
}
