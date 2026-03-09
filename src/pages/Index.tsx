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
import { FeaturedSpotlight } from '@/components/movies/FeaturedSpotlight';
import { GenreChips } from '@/components/home/GenreChips';
import { ScrollReveal, ScrollScale } from '@/components/animations/ScrollAnimations';
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
      .order('popularity', { ascending: false })
      .order('release_date', { ascending: false });

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
          {/* Hero skeleton with cinematic feel */}
          <div className="relative h-[90vh] min-h-[700px] overflow-hidden bg-muted/30">
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
            <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-background via-background/95 to-transparent" />
            <div className="relative container mx-auto px-4 h-full flex items-end pb-28">
              <div className="max-w-2xl space-y-7">
                <Skeleton className="h-8 w-40 rounded-full" />
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full max-w-lg rounded-xl" />
                  <Skeleton className="h-10 w-3/4 max-w-md rounded-xl" />
                </div>
                <Skeleton className="h-14 w-full max-w-md rounded-lg" />
                <div className="flex gap-3">
                  <Skeleton className="h-14 w-48 rounded-full" />
                  <Skeleton className="h-14 w-44 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Content skeleton */}
          <div className="container mx-auto px-4 py-20">
            <div className="space-y-3 mb-12">
              <Skeleton className="h-3 w-20 rounded-full" />
              <Skeleton className="h-10 w-56 rounded-xl" />
              <Skeleton className="h-5 w-80 rounded-lg" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[2/3] rounded-2xl" />
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                  <Skeleton className="h-3 w-1/2 rounded-lg" />
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
      initial={{ opacity: 0, filter: 'blur(4px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Header />
      
      <main id="main-content" className="flex-1">
        {/* Hero — auto-rotating through top movies */}
        {featuredMovie && (
          <HeroSection 
            movie={featuredMovie} 
            movies={nowShowing.filter(m => m.backdrop_url).slice(0, 6)}
            autoRotateInterval={3000}
          />
        )}
        
        {/* Quick Rebook — slide up reveal */}
        <ScrollReveal direction="up" distance={30} duration={0.6}>
          <div className="container mx-auto px-4 py-10">
            <QuickRebook />
          </div>
        </ScrollReveal>

        {/* Genre Filter Chips */}
        <GenreChips />
        
        {/* Trending Carousel — scale reveal */}
        {nowShowing.length > 0 && (
          <ScrollScale scaleRange={[0.95, 1]}>
            <TrendingCarousel movies={nowShowing} />
          </ScrollScale>
        )}

        {/* Editor's Picks — reveal from left */}
        {nowShowing.length >= 3 && (
          <ScrollReveal direction="up" distance={50} duration={0.8}>
            <FeaturedSpotlight movies={nowShowing} />
          </ScrollReveal>
        )}

        {/* Section Divider */}
        <div className="relative py-2">
          <div className="section-divider mx-auto w-full max-w-4xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full cinema-gradient opacity-60" />
        </div>

        {/* Now Showing Grid */}
        {nowShowing.length > 0 && (
          <ScrollReveal direction="up" distance={40} duration={0.7}>
            <MovieGrid
              movies={nowShowing}
              title="Now Showing"
              subtitle="Book tickets for movies currently in theatres"
            />
          </ScrollReveal>
        )}

        {/* Stats Section — already has its own scroll animations, wrap with scale */}
        <ScrollScale scaleRange={[0.94, 1]}>
          <StatsSection />
        </ScrollScale>
        
        {/* Personalized Recommendations */}
        <ScrollReveal direction="up" distance={35} duration={0.6}>
          <div className="container mx-auto px-4 py-10">
            <MovieRecommendations limit={6} />
          </div>
        </ScrollReveal>
        
        {/* Coming Soon */}
        {comingSoon.length > 0 && (
          <ScrollReveal direction="up" distance={40} duration={0.7} delay={0.1}>
            <MovieGrid
              movies={comingSoon}
              title="Coming Soon"
              subtitle="Get ready for upcoming blockbusters"
            />
          </ScrollReveal>
        )}
        
        {nowShowing.length === 0 && comingSoon.length === 0 && (
          <ScrollReveal>
            <div className="container mx-auto px-4 py-24 text-center">
              <h2 className="text-2xl font-bold mb-4">No Movies Available</h2>
              <p className="text-muted-foreground">
                Movies will appear here once the TMDB API is configured.
              </p>
            </div>
          </ScrollReveal>
        )}
      </main>

      <Footer />
    </motion.div>
  );
};

export default Index;
