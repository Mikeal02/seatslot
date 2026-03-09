import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Movie } from '@/types/database';

interface FloatingBookCTAProps {
  movie: Movie;
  hasShowtimes: boolean;
  onBookClick: () => void;
}

export function FloatingBookCTA({ movie, hasShowtimes, onBookClick }: FloatingBookCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const heroHeight = window.innerHeight * 0.5; // Show after scrolling past 50vh
      
      // Show when scrolled past hero and scrolling down, hide when near top
      if (currentScrollY > heroHeight) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (!hasShowtimes) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/30 shadow-2xl shadow-black/20">
            {/* Mini movie info */}
            <div className="flex items-center gap-3">
              <img 
                src={movie.poster_url || '/placeholder.svg'} 
                alt="" 
                className="w-10 h-14 rounded-lg object-cover shadow-md hidden sm:block"
              />
              <div className="max-w-[150px] sm:max-w-[180px]">
                <p className="text-sm font-bold line-clamp-1">{movie.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {movie.duration_minutes}m
                  </span>
                  {movie.rating && movie.rating > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-accent text-accent" />
                      {movie.rating}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="w-px h-10 bg-border/50 hidden sm:block" />

            <Button 
              onClick={onBookClick}
              className="cinema-gradient btn-professional rounded-xl h-10 px-5 text-sm font-bold shadow-lg shadow-primary/25"
            >
              <Ticket className="h-4 w-4 mr-1.5" />
              Book Now
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
