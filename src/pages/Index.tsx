import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/movies/HeroSection';
import { MovieGrid } from '@/components/movies/MovieGrid';
import { Movie } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

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

const Index = () => {
  const [nowShowing, setNowShowing] = useState<Movie[]>([]);
  const [comingSoon, setComingSoon] = useState<Movie[]>([]);
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    syncAndFetchMovies();
  }, []);

  const syncAndFetchMovies = async () => {
    try {
      // First, try to sync movies from TMDB
      const syncSuccess = await syncTMDBMovies();
      
      if (!syncSuccess) {
        console.log('TMDB sync skipped or failed, fetching from database only');
      }
      
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
      
      if (movies?.length === 0) {
        toast({
          title: 'No movies found',
          description: 'Add a TMDB API key to import movies automatically.',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncTMDBMovies = async (): Promise<boolean> => {
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
      
      if (!nowPlayingRes.ok) {
        console.warn('TMDB API returned error');
        return false;
      }
      
      const nowPlayingData = await nowPlayingRes.json();
      
      // Check if there's an error (API key not configured)
      if (nowPlayingData.error) {
        console.warn('TMDB API error:', nowPlayingData.error);
        return false;
      }
      
      if (nowPlayingData.movies?.length > 0) {
        for (const movie of nowPlayingData.movies.slice(0, 8)) {
          await upsertMovie(movie, 'now_showing');
        }
      }

      // Fetch upcoming movies from TMDB for "Coming Soon" section
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
        if (upcomingData.movies?.length > 0) {
          // Filter to only include movies with future release dates
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const futureMovies = upcomingData.movies.filter((movie: TMDBMovie) => {
            if (!movie.release_date) return false;
            const releaseDate = new Date(movie.release_date);
            releaseDate.setHours(0, 0, 0, 0);
            return releaseDate > today;
          });
          
          for (const movie of futureMovies.slice(0, 6)) {
            await upsertMovie(movie, 'coming_soon');
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error syncing TMDB movies:', error);
      return false;
    }
  };

  const determineMovieStatus = (releaseDate: string | null): 'now_showing' | 'coming_soon' => {
    if (!releaseDate) return 'now_showing';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const release = new Date(releaseDate);
    release.setHours(0, 0, 0, 0);
    return release <= today ? 'now_showing' : 'coming_soon';
  };

  const upsertMovie = async (tmdbMovie: TMDBMovie, _preferredStatus: 'now_showing' | 'coming_soon') => {
    try {
      const { data: existing } = await supabase
        .from('movies')
        .select('id')
        .ilike('title', tmdbMovie.title)
        .maybeSingle();

      // Determine actual status based on release date
      const actualStatus = determineMovieStatus(tmdbMovie.release_date);

      const movieData = {
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
        status: actualStatus,
      };

      if (existing) {
        await supabase
          .from('movies')
          .update(movieData)
          .eq('id', existing.id);
      } else {
        await supabase.from('movies').insert(movieData);
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
        
        {nowShowing.length > 0 && (
          <MovieGrid
            movies={nowShowing}
            title="Now Showing"
            subtitle="Book tickets for movies currently in theatres"
          />
        )}
        
        {comingSoon.length > 0 && (
          <MovieGrid
            movies={comingSoon}
            title="Coming Soon"
            subtitle="Get ready for upcoming blockbusters"
          />
        )}
        
        {nowShowing.length === 0 && comingSoon.length === 0 && (
          <div className="container mx-auto px-4 py-20 text-center">
            <h2 className="text-2xl font-bold mb-4">No Movies Available</h2>
            <p className="text-muted-foreground">
              Movies will appear here once the TMDB API is configured.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
