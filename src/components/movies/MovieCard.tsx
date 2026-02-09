import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Star, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Movie } from '@/types/database';

interface MovieCardProps {
  movie: Movie;
  index?: number;
}

// Helper function to determine if movie is now showing based on release date
const isNowShowing = (releaseDate: string | null): boolean => {
  if (!releaseDate) return true; // No date = assume available
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const release = new Date(releaseDate);
  release.setHours(0, 0, 0, 0);
  return release <= today;
};

export function MovieCard({ movie, index = 0 }: MovieCardProps) {
  const nowShowing = isNowShowing(movie.release_date);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1]
      }}
    >
      <Card className="group overflow-hidden bg-card border-border/50 hover:border-primary/30 transition-all duration-500 glow-card h-full flex flex-col">
        <div className="relative w-full overflow-hidden" style={{ paddingBottom: '150%' }}>
          <img
            src={movie.poster_url || '/placeholder.svg'}
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Rating badge */}
          {nowShowing && movie.rating && movie.rating > 0 && (
            <motion.div 
              className="absolute top-3 right-3 flex items-center gap-1.5 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-lg"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              <span className="text-xs font-semibold">{movie.rating}</span>
            </motion.div>
          )}

          {/* Coming Soon badge */}
          {!nowShowing && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-accent text-accent-foreground text-xs font-medium">
                Coming Soon
              </Badge>
            </div>
          )}

          {/* Hover overlay with button */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
            <Button 
              asChild 
              className="w-full cinema-gradient btn-professional shadow-xl shadow-primary/30 h-10"
            >
              <Link to={`/movie/${movie.id}`} className="flex items-center justify-center gap-2">
                <Play className="h-4 w-4 fill-current" />
                {nowShowing ? 'Book Now' : 'View Details'}
              </Link>
            </Button>
          </div>
        </div>

        <CardContent className="p-3 sm:p-4 space-y-2.5 flex-1 flex flex-col bg-card">
          <div className="flex-1">
            <h3 className="font-semibold text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-snug">
              {movie.title}
            </h3>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {movie.genre.slice(0, 2).map((g) => (
                <Badge 
                  key={g} 
                  variant="secondary" 
                  className="text-[10px] sm:text-xs px-2 py-0.5 font-medium"
                >
                  {g}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground pt-1 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0 text-primary/70" />
              <span>{movie.duration_minutes} min</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
