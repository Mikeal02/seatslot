import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Clock, Star, Sparkles, Ticket, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Movie } from '@/types/database';

interface HeroSectionProps {
  movie: Movie;
  movies?: Movie[];
  autoRotateInterval?: number;
}

export function HeroSection({ movie, movies, autoRotateInterval = 5000 }: HeroSectionProps) {
  const heroMovies = (movies && movies.length > 1)
    ? movies.filter(m => m.backdrop_url).slice(0, 6)
    : [movie];
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const currentMovie = heroMovies[activeIndex] || movie;

  // Auto-rotate
  useEffect(() => {
    if (heroMovies.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % heroMovies.length);
    }, autoRotateInterval);
    return () => clearInterval(timer);
  }, [heroMovies.length, autoRotateInterval, isPaused]);

  // Preload all hero backdrops + posters once so transitions are instant
  useEffect(() => {
    heroMovies.forEach(m => {
      if (m.backdrop_url) { const i = new Image(); i.decoding = 'async'; i.src = m.backdrop_url; }
      if (m.poster_url) { const i = new Image(); i.decoding = 'async'; i.src = m.poster_url; }
    });
  }, [heroMovies]);

  const goTo = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const goPrev = useCallback(() => {
    setActiveIndex(prev => (prev - 1 + heroMovies.length) % heroMovies.length);
  }, [heroMovies.length]);

  const goNext = useCallback(() => {
    setActiveIndex(prev => (prev + 1) % heroMovies.length);
  }, [heroMovies.length]);

  return (
    <section 
      className="relative h-[78vh] min-h-[560px] sm:h-[88vh] sm:min-h-[680px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Images with crossfade */}
      <AnimatePresence mode="sync">
        <motion.div
          key={currentMovie.id}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <img
            src={currentMovie.backdrop_url || currentMovie.poster_url || '/placeholder.svg'}
            alt={currentMovie.title}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Multi-layer cinematic overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
      <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-background via-background/95 to-transparent" />
      
      {/* Animated cinematic light leak */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(ellipse at 0% 100%, hsl(var(--primary) / 0.2) 0%, transparent 50%)',
            'radial-gradient(ellipse at 20% 70%, hsl(var(--accent) / 0.15) 0%, transparent 50%)',
            'radial-gradient(ellipse at 10% 90%, hsl(var(--primary) / 0.2) 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />

      {/* Film grain overlay */}
      <div className="absolute inset-0 noise-overlay pointer-events-none" />

      {/* Cinematic top bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] cinema-gradient opacity-60" />

      {/* Content with crossfade */}
      <div className="relative container mx-auto h-full flex items-end pb-16 sm:pb-24 md:pb-28">
        <div className="max-w-2xl space-y-4 sm:space-y-6 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMovie.id}
              className="space-y-4 sm:space-y-6"
              initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {/* Featured Badge */}
              <Badge className="cinema-gradient text-primary-foreground gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] rounded-full shadow-xl shadow-primary/25 border-0">
                <Sparkles className="h-3 w-3" />
                Featured Today
              </Badge>

              {/* Title */}
              <h1 className="text-[2rem] xs:text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black leading-[0.95] text-cinema-shadow">
                <span className="block shimmer-text">{currentMovie.title}</span>
              </h1>

              {/* Description */}
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground line-clamp-2 sm:line-clamp-3 max-w-xl leading-relaxed">
                {currentMovie.description}
              </p>

              {/* Metadata pills */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 sm:gap-2 glass-card px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  <span className="font-semibold">{currentMovie.duration_minutes} min</span>
                </div>
                {currentMovie.rating && currentMovie.rating > 0 && (
                  <div className="flex items-center gap-1.5 sm:gap-2 glass-card px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm">
                    <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-accent text-accent" />
                    <span className="font-semibold">{currentMovie.rating}/10</span>
                  </div>
                )}
                {currentMovie.genre && currentMovie.genre.length > 0 && (
                  <div className="hidden xs:flex items-center gap-2 glass-card px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm">
                    <span className="font-semibold">{(currentMovie.genre as string[]).slice(0, 2).join(' · ')}</span>
                  </div>
                )}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  asChild 
                  variant="cinema"
                  size="xl"
                  className="rounded-full group"
                >
                  <Link to={`/movie/${currentMovie.id}`}>
                    <Ticket className="h-5 w-5 mr-2" />
                    Book Tickets
                    <ChevronRight className="h-4 w-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button 
                  asChild 
                  size="xl"
                  variant="outline" 
                  className="bg-card/15 backdrop-blur-xl border-border/20 hover:bg-card/40 rounded-full"
                >
                  <Link to={`/movie/${currentMovie.id}`}>
                    <Play className="h-5 w-5 mr-2 fill-current" />
                    Watch Trailer
                  </Link>
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation dots + arrows */}
          {heroMovies.length > 1 && (
            <motion.div 
              className="flex items-center gap-4 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {/* Prev/Next arrows */}
              <button
                onClick={goPrev}
                className="h-9 w-9 rounded-full glass-card flex items-center justify-center hover:bg-card/60 transition-all group"
                aria-label="Previous movie"
              >
                <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>

              {/* Dots with progress indicator */}
              <div className="flex items-center gap-2">
                {heroMovies.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => goTo(i)}
                    className="relative h-2 rounded-full overflow-hidden transition-all duration-500"
                    style={{ width: i === activeIndex ? 32 : 8 }}
                    aria-label={`Go to ${m.title}`}
                  >
                    <div className={`absolute inset-0 rounded-full transition-colors duration-300 ${
                      i === activeIndex ? 'bg-muted/40' : 'bg-muted-foreground/20 hover:bg-muted-foreground/40'
                    }`} />
                    {i === activeIndex && !isPaused && (
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full cinema-gradient"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: autoRotateInterval / 1000, ease: 'linear' }}
                        key={`progress-${activeIndex}-${Date.now()}`}
                      />
                    )}
                    {i === activeIndex && isPaused && (
                      <div className="absolute inset-0 rounded-full cinema-gradient opacity-80" />
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={goNext}
                className="h-9 w-9 rounded-full glass-card flex items-center justify-center hover:bg-card/60 transition-all group"
                aria-label="Next movie"
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>

              {/* Movie counter */}
              <span className="text-[11px] text-muted-foreground font-semibold tracking-wider ml-2">
                {String(activeIndex + 1).padStart(2, '0')} / {String(heroMovies.length).padStart(2, '0')}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Right-side mini poster strip */}
      {heroMovies.length > 1 && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-2.5 z-10">
          {heroMovies.map((m, i) => (
            <motion.button
              key={m.id}
              onClick={() => goTo(i)}
              className={`relative w-14 aspect-[2/3] rounded-lg overflow-hidden border-2 transition-all duration-500 ${
                i === activeIndex 
                  ? 'border-primary/80 shadow-lg shadow-primary/20 scale-110 z-10' 
                  : 'border-border/20 opacity-50 hover:opacity-80 hover:border-border/40'
              }`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              whileHover={{ scale: i === activeIndex ? 1.1 : 1.05 }}
            >
              <img
                src={m.poster_url || '/placeholder.svg'}
                alt={m.title}
                className="w-full h-full object-cover"
              />
              {i === activeIndex && (
                <motion.div
                  className="absolute inset-0 border-2 border-primary rounded-lg"
                  layoutId="hero-poster-ring"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Bottom vignette line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
    </section>
  );
}
