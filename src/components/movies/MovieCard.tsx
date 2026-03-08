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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1]
      }}
    >
      <Card className="group overflow-hidden bg-card border-border/30 hover:border-primary/30 transition-all duration-500 glow-card h-full flex flex-col rounded-2xl">
        <div className="relative w-full overflow-hidden" style={{ paddingBottom: '150%' }}>
          <img
            src={movie.poster_url || '/placeholder.svg'}
            alt={`${movie.title} movie poster`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Rating badge */}
          {nowShowing && movie.rating && movie.rating > 0 && (
            <motion.div 
              className="absolute top-3 right-3 flex items-center gap-1.5 bg-card/90 backdrop-blur-xl px-2.5 py-1.5 rounded-full shadow-xl border border-border/20"
              whileHover={{ scale: 1.05 }}
            >
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              <span className="text-xs font-bold tracking-tight">{movie.rating}</span>
            </motion.div>
          )}

          {/* Coming Soon badge */}
          {!nowShowing && (
            <div className="absolute top-3 left-3">
              <Badge className="cinema-gradient text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-primary/20 border-0 uppercase tracking-wider">
                Coming Soon
              </Badge>
            </div>
          )}

          {/* Genre tags on hover */}
          {movie.genre && movie.genre.length > 0 && (
            <div className="absolute top-3 left-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {nowShowing && movie.genre.slice(0, 2).map((g) => (
                <span key={g} className="text-[10px] font-medium bg-card/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-border/20">
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Hover action button */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
            <Button 
              asChild 
              className="w-full cinema-gradient btn-professional shadow-2xl shadow-primary/40 h-10 rounded-full text-sm font-bold"
            >
              <Link to={`/movie/${movie.id}`} className="flex items-center justify-center gap-2">
                {nowShowing ? <Ticket className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                {nowShowing ? 'Book Now' : 'View Details'}
              </Link>
            </Button>
          </div>
        </div>

        <CardContent className="p-3.5 sm:p-4 space-y-2 flex-1 flex flex-col bg-card">
          <div className="flex-1">
            <h3 className="font-bold text-sm sm:text-[15px] line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-snug tracking-tight">
              {movie.title}
            </h3>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 shrink-0 text-primary/60" />
              <span className="font-medium">{movie.duration_minutes} min</span>
            </div>
            {nowShowing && (
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">In Theatres</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
