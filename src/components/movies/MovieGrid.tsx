import { MovieCard } from './MovieCard';
import { Movie } from '@/types/database';

interface MovieGridProps {
  movies: Movie[];
  title: string;
  subtitle?: string;
}

export function MovieGrid({ movies, title, subtitle }: MovieGridProps) {
  if (movies.length === 0) {
    return null;
  }

  return (
    <section className="py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold cinema-gradient-text">{title}</h2>
          {subtitle && (
            <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">{subtitle}</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </div>
    </section>
  );
}
