import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Star, Play, Ticket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Movie } from '@/types/database';

interface MovieCardProps {
  movie: Movie;
  index?: number;
}

const isNowShowing = (releaseDate: string | null): boolean => {
  if (!releaseDate) return true;
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
        delay: index * 0.04,
        ease: [0.25, 0.1, 0.25, 1]
      }}
    >
      <Card className="group overflow-hidden bg-card border-border/40 hover:border-primary/20 transition-all duration-500 glow-card h-full flex flex-col rounded-xl">
        <div className="relative w-full overflow-hidden" style={{ paddingBottom: '150%' }}>
          <img
            src={movie.poster_url || '/placeholder.svg'}
            alt={`${movie.title} movie poster`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-80" />
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Rating badge */}
          {nowShowing && movie.rating && movie.rating > 0 && (
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-card/90 backdrop-blur-md px-2 py-1 rounded-full shadow-lg border border-border/30">
              <Star className="h-3 w-3 fill-accent text-accent" />
              <span className="text-[11px] font-bold">{movie.rating}</span>
            </div>
          )}

          {/* Coming Soon badge */}
          {!nowShowing && (
            <div className="absolute top-2.5 left-2.5">
              <Badge className="bg-accent text-accent-foreground text-[10px] font-semibold px-2.5 rounded-full">
                Coming Soon
              </Badge>
            </div>
          )}

          {/* Hover action */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
            <Button 
              asChild 
              className="w-full cinema-gradient btn-professional shadow-xl shadow-primary/30 h-9 rounded-full text-sm"
            >
              <Link to={`/movie/${movie.id}`} className="flex items-center justify-center gap-1.5">
                {nowShowing ? <Ticket className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                {nowShowing ? 'Book Now' : 'View Details'}
              </Link>
            </Button>
          </div>
        </div>

        <CardContent className="p-3 sm:p-4 space-y-1.5 flex-1 flex flex-col bg-card">
          <div className="flex-1">
            <h3 className="font-semibold text-sm sm:text-[15px] line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-snug">
              {movie.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <Clock className="h-3 w-3 shrink-0 text-primary/60" />
            <span>{movie.duration_minutes} min</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
