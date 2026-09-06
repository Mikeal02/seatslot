import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BentoShowcase } from "@/components/home/BentoShowcase";
import { MovieGrid } from "@/components/movies/MovieGrid";
import { QuickRebook } from "@/components/booking/QuickRebook";
import { MovieRecommendations } from "@/components/movies/MovieRecommendations";
import { StatsSection } from "@/components/home/StatsSection";
import { TrendingCarousel } from "@/components/movies/TrendingCarousel";
import { FeaturedSpotlight } from "@/components/movies/FeaturedSpotlight";
import { GenreChips } from "@/components/home/GenreChips";
import { CinemaTicker } from "@/components/effects/CinemaTicker";
import {
  ScrollReveal,
  ScrollScale,
} from "@/components/animations/ScrollAnimations";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useMovieSync } from "@/hooks/useMovieSync";
import { useMovieCatalogue, useInvalidateMovies } from "@/data";

const Index = () => {
  const { catalogue, isLoading, error } = useMovieCatalogue();
  const invalidateMovies = useInvalidateMovies();
  const { toast } = useToast();
  const { syncMovies } = useMovieSync();
  const syncedOnce = useRef(false);

  const { nowShowing, comingSoon, spotlight } = catalogue;
  const featuredMovie = spotlight[0] ?? nowShowing[0] ?? null;

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to load movies",
        description: "Please refresh the page to try again.",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    if (syncedOnce.current) return;
    syncedOnce.current = true;
    // TMDB sync respects its own TTL; refresh the catalogue only if it ran.
    syncMovies()
      .then((synced) => {
        if (synced) invalidateMovies();
      })
      .catch(() => undefined);
  }, [syncMovies, invalidateMovies]);

  const loading = isLoading;


  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1">
          {/* Hero skeleton with cinematic feel */}
          <div className="relative h-[78vh] min-h-[560px] sm:h-[88vh] sm:min-h-[680px] overflow-hidden bg-muted/30">
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
            <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-background via-background/95 to-transparent" />
            <div className="relative container mx-auto h-full flex items-end pb-16 sm:pb-28">
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
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
      transition={{ duration: 0.42, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Header />

      <main id="main-content" className="flex-1">
        {/* Bento showcase — hero, quick booking, genres, trending, membership */}
        {featuredMovie && (
          <BentoShowcase featured={featuredMovie} movies={spotlight} />
        )}

        {/* Cinema Ticker — film reel marquee */}
        <CinemaTicker />

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
      {/* Bottom padding for mobile nav bar */}
      <div className="h-16 lg:hidden" />
    </motion.div>
  );
};

export default Index;
