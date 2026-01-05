import { Link } from 'react-router-dom';
import { Play, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Movie } from '@/types/database';

interface HeroSectionProps {
  movie: Movie;
}

export function HeroSection({ movie }: HeroSectionProps) {
  return (
    <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={movie.backdrop_url || movie.poster_url || '/placeholder.svg'}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl space-y-6">
          <div className="flex gap-2">
            {movie.genre.map((g) => (
              <Badge key={g} variant="outline" className="border-primary/50 text-primary">
                {g}
              </Badge>
            ))}
          </div>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            {movie.title}
          </h1>

          <p className="text-lg text-muted-foreground line-clamp-3">
            {movie.description}
          </p>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>{movie.duration_minutes} min</span>
            </div>
            {movie.rating && movie.rating > 0 && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span>{movie.rating}/10</span>
              </div>
            )}
            {movie.director && (
              <div className="text-muted-foreground">
                Directed by <span className="text-foreground">{movie.director}</span>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button asChild size="lg" className="cinema-gradient">
              <Link to={`/movie/${movie.id}`}>
                <Play className="h-5 w-5 mr-2" />
                Book Tickets
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={`/movie/${movie.id}`}>View Details</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
