import { motion } from 'framer-motion';
import { Film, TrendingUp } from 'lucide-react';
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

  const isNowShowing = title.toLowerCase().includes('now');

  return (
    <section className="py-16 sm:py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div 
          className="mb-12 sm:mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="section-label mb-4">
            {isNowShowing ? 'In theatres' : 'Coming up'}
          </p>
          <div className="flex items-center gap-4">
            <div className="section-header-icon">
              {isNowShowing ? <Film /> : <TrendingUp />}
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black">{title}</h2>
              {subtitle && (
                <p className="text-muted-foreground text-sm sm:text-base mt-1.5 leading-relaxed">{subtitle}</p>
              )}
            </div>
          </div>
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
