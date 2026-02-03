import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/movies/HeroSection';
import { MovieGrid } from '@/components/movies/MovieGrid';
import { QuickRebook } from '@/components/booking/QuickRebook';
import { MovieRecommendations } from '@/components/movies/MovieRecommendations';
import { Movie } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useMovieSync } from '@/hooks/useMovieSync';

const Index = () => {
  const [nowShowing, setNowShowing] = useState<Movie[]>([]);
  const [comingSoon, setComingSoon] = useState<Movie[]>([]);
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { syncMovies } = useMovieSync();

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      // Immediately fetch from database first (fast)
      await fetchMoviesFromDB();
      setLoading(false);

      // Then sync in background (won't block UI)
      const synced = await syncMovies();
      if (synced) {
        // Refresh movies after sync completes
        await fetchMoviesFromDB();
      }
    } catch (error) {
      console.error('Error loading movies:', error);
      setLoading(false);
    }
  };

  const fetchMoviesFromDB = async () => {
    const { data: movies, error } = await supabase
      .from('movies')
      .select('*')
      .order('rating', { ascending: false });

    if (error) {
      console.error('Error fetching movies:', error);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Derive sections from release_date
    const now = (movies || []).filter((m) => {
      if (!m.release_date) return true;
      const release = new Date(m.release_date);
      release.setHours(0, 0, 0, 0);
      return release <= today;
    });

    const coming = (movies || []).filter((m) => {
      if (!m.release_date) return false;
      const release = new Date(m.release_date);
      release.setHours(0, 0, 0, 0);
      return release > today;
    });

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
        
        {/* Quick Rebook for returning users */}
        <div className="container mx-auto px-4 py-8">
          <QuickRebook />
        </div>
        
        {nowShowing.length > 0 && (
          <MovieGrid
            movies={nowShowing}
            title="Now Showing"
            subtitle="Book tickets for movies currently in theatres"
          />
        )}
        
        {/* Personalized Recommendations */}
        <div className="container mx-auto px-4 py-8">
          <MovieRecommendations limit={6} />
        </div>
        
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
