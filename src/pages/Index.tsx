import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/movies/HeroSection';
import { MovieGrid } from '@/components/movies/MovieGrid';
import { Movie } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';

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

const Index = () => {
  const [nowShowing, setNowShowing] = useState<Movie[]>([]);
  const [comingSoon, setComingSoon] = useState<Movie[]>([]);
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    syncAndFetchMovies();
  }, []);

  const syncAndFetchMovies = async () => {
    try {
      // First, try to sync movies from TMDB
      await syncTMDBMovies();
      
      // Then fetch from database
      const { data: movies, error } = await supabase
        .from('movies')
        .select('*')
        .order('rating', { ascending: false });

      if (error) throw error;

      const now = movies?.filter((m) => m.status === 'now_showing') || [];
      const coming = movies?.filter((m) => m.status === 'coming_soon') || [];

      setNowShowing(now as Movie[]);
      setComingSoon(coming as Movie[]);
      setFeaturedMovie((now[0] as Movie) || null);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncTMDBMovies = async () => {
    try {
      // Fetch now playing from TMDB
      const nowPlayingRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-movies?action=now_playing`,
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      
      if (nowPlayingRes.ok) {
        const nowPlayingData = await nowPlayingRes.json();
        if (nowPlayingData.movies) {
          for (const movie of nowPlayingData.movies.slice(0, 8)) {
            await upsertMovie(movie, 'now_showing');
          }
        }
      }

      // Fetch upcoming from TMDB
      const upcomingRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-movies?action=upcoming`,
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      
      if (upcomingRes.ok) {
        const upcomingData = await upcomingRes.json();
        if (upcomingData.movies) {
          for (const movie of upcomingData.movies.slice(0, 6)) {
            await upsertMovie(movie, 'coming_soon');
          }
        }
      }
    } catch (error) {
      console.error('Error syncing TMDB movies:', error);
    }
  };

  const upsertMovie = async (tmdbMovie: TMDBMovie, status: 'now_showing' | 'coming_soon') => {
    try {
      const { data: existing } = await supabase
        .from('movies')
        .select('id')
        .ilike('title', tmdbMovie.title)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('movies')
          .update({
            description: tmdbMovie.description,
            poster_url: tmdbMovie.poster_url,
            backdrop_url: tmdbMovie.backdrop_url,
            release_date: tmdbMovie.release_date,
            rating: tmdbMovie.rating,
            duration_minutes: tmdbMovie.duration_minutes || 120,
            genre: tmdbMovie.genre || [],
            director: tmdbMovie.director,
            cast_members: tmdbMovie.cast_members || [],
            status,
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('movies').insert({
          title: tmdbMovie.title,
          description: tmdbMovie.description,
          poster_url: tmdbMovie.poster_url,
          backdrop_url: tmdbMovie.backdrop_url,
          release_date: tmdbMovie.release_date,
          rating: tmdbMovie.rating,
          duration_minutes: tmdbMovie.duration_minutes || 120,
          genre: tmdbMovie.genre || [],
          director: tmdbMovie.director,
          cast_members: tmdbMovie.cast_members || [],
          status,
        });
      }
    } catch (error) {
      console.error('Error upserting movie:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1">
          <Skeleton className="h-[70vh] w-full" />
          <div className="container mx-auto px-4 py-12">
            <Skeleton className="h-8 w-48 mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {featuredMovie && <HeroSection movie={featuredMovie} />}
        
        <MovieGrid
          movies={nowShowing}
          title="Now Showing"
          subtitle="Book tickets for movies currently in theatres"
        />
        
        <MovieGrid
          movies={comingSoon}
          title="Coming Soon"
          subtitle="Get ready for upcoming blockbusters"
        />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
