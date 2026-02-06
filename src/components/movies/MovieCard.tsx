import { Link } from 'react-router-dom';
import { Clock, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Movie } from '@/types/database';

interface MovieCardProps {
  movie: Movie;
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

export function MovieCard({ movie }: MovieCardProps) {
  const nowShowing = isNowShowing(movie.release_date);
  
  return (
    <Card className="group overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 glow-card h-full flex flex-col">
      <div className="relative w-full overflow-hidden" style={{ paddingBottom: '150%' }}>
        <img
          src={movie.poster_url || '/placeholder.svg'}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {nowShowing && movie.rating && movie.rating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="text-xs font-medium">{movie.rating}</span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button asChild className="w-full cinema-gradient text-xs sm:text-sm" size="sm">
            <Link to={`/movie/${movie.id}`}>
              {nowShowing ? 'Book Now' : 'View Details'}
            </Link>
          </Button>
        </div>
      </div>

      <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="font-semibold text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors leading-tight">
            {movie.title}
          </h3>
          <div className="flex flex-wrap gap-1 mt-1 sm:mt-2">
            {movie.genre.slice(0, 2).map((g) => (
              <Badge key={g} variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                {g}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
            <span>{movie.duration_minutes} min</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
