import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/movies/HeroSection';
import { MovieGrid } from '@/components/movies/MovieGrid';
import { Movie } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const [nowShowing, setNowShowing] = useState<Movie[]>([]);
  const [comingSoon, setComingSoon] = useState<Movie[]>([]);
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
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
