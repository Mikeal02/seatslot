import { motion } from 'framer-motion';
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
    <section className="py-12 sm:py-16 relative">
      <div className="container mx-auto px-4">
        <motion.div 
          className="mb-8 sm:mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 rounded-full cinema-gradient" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">{title}</h2>
          </div>
          {subtitle && (
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl ml-4 pl-3">{subtitle}</p>
          )}
        </motion.div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
          {movies.map((movie, index) => (
            <MovieCard key={movie.id} movie={movie} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
