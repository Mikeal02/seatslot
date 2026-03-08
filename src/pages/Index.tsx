import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/movies/HeroSection';
import { MovieGrid } from '@/components/movies/MovieGrid';
import { QuickRebook } from '@/components/booking/QuickRebook';
import { MovieRecommendations } from '@/components/movies/MovieRecommendations';
import { StatsSection } from '@/components/home/StatsSection';
import { TrendingCarousel } from '@/components/movies/TrendingCarousel';
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
      await fetchMoviesFromDB();
      setLoading(false);
      const synced = await syncMovies();
      if (synced) {
        await fetchMoviesFromDB();
      }
    } catch (error) {
      setLoading(false);
      toast({
        variant: 'destructive',
        title: 'Failed to load movies',
        description: 'Please refresh the page to try again.',
      });
    }
  };

  const fetchMoviesFromDB = async () => {
    const { data: movies, error } = await supabase
      .from('movies')
      .select('*')
      .order('rating', { ascending: false });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch movies. Please try again later.',
      });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
          <div className="relative h-[75vh] min-h-[550px] overflow-hidden">
            <Skeleton className="absolute inset-0" />
            <div className="relative container mx-auto px-4 h-full flex items-center">
              <div className="max-w-2xl space-y-6">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-16 w-full max-w-lg" />
                <Skeleton className="h-20 w-full max-w-md" />
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-40" />
                  <Skeleton className="h-12 w-32" />
                </div>
              </div>
            </div>
          </div>
          <div className="container mx-auto px-4 py-12">
            <Skeleton className="h-10 w-48 mb-3" />
            <Skeleton className="h-5 w-72 mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[2/3] rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen flex flex-col bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Header />
      
      <main id="main-content" className="flex-1">
        {featuredMovie && <HeroSection movie={featuredMovie} />}
        
        {/* Quick Rebook */}
        <motion.div 
          className="container mx-auto px-4 py-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <QuickRebook />
        </motion.div>
        
        {nowShowing.length > 0 && (
          <MovieGrid
            movies={nowShowing}
            title="Now Showing"
            subtitle="Book tickets for movies currently in theatres"
          />
        )}

        {/* Stats Section */}
        <StatsSection />
        
        {/* Personalized Recommendations */}
        <motion.div 
          className="container mx-auto px-4 py-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <MovieRecommendations limit={6} />
        </motion.div>
        
        {comingSoon.length > 0 && (
          <MovieGrid
            movies={comingSoon}
            title="Coming Soon"
            subtitle="Get ready for upcoming blockbusters"
          />
        )}
        
        {nowShowing.length === 0 && comingSoon.length === 0 && (
          <motion.div 
            className="container mx-auto px-4 py-20 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-4">No Movies Available</h2>
            <p className="text-muted-foreground">
              Movies will appear here once the TMDB API is configured.
            </p>
          </motion.div>
        )}
      </main>

      <Footer />
    </motion.div>
  );
};

export default Index;
