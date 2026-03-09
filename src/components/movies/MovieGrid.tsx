import { motion } from 'framer-motion';
import { Film, TrendingUp, Sparkles } from 'lucide-react';
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
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/[0.02] blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/[0.02] blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 relative">
        <motion.div 
          className="mb-12 sm:mb-16"
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
                <p className="text-muted-foreground text-sm sm:text-base mt-1.5 leading-relaxed max-w-lg">{subtitle}</p>
              )}
            </div>
          </div>
          {/* Section accent line */}
          <div className="mt-6 h-px w-24 cinema-gradient rounded-full opacity-60" />
        </motion.div>

        {/* Movie count pill */}
        <motion.div 
          className="flex items-center gap-2 mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-1.5 glass-card px-3 py-1.5 rounded-full text-[11px] font-semibold text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            {movies.length} {isNowShowing ? 'movies showing' : 'upcoming titles'}
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
