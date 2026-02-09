import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Clock, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Movie } from '@/types/database';

interface HeroSectionProps {
  movie: Movie;
}

export function HeroSection({ movie }: HeroSectionProps) {
  return (
    <section className="relative h-[75vh] min-h-[550px] overflow-hidden">
      {/* Background Image with Parallax Effect */}
      <motion.div 
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <img
          src={movie.backdrop_url || movie.poster_url || '/placeholder.svg'}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        
        {/* Subtle animated gradient overlay */}
        <motion.div 
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              'radial-gradient(circle at 0% 100%, hsl(var(--primary) / 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 100% 100%, hsl(var(--accent) / 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 0% 100%, hsl(var(--primary) / 0.3) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>

      {/* Content */}
      <div className="relative container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl space-y-5 md:space-y-6">
          {/* Featured Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Badge className="cinema-gradient text-primary-foreground gap-1.5 px-3 py-1">
              <Sparkles className="h-3 w-3" />
              Featured Today
            </Badge>
          </motion.div>

          {/* Genre Badges */}
          <motion.div 
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {movie.genre.slice(0, 3).map((g) => (
              <Badge 
                key={g} 
                variant="outline" 
                className="border-primary/40 text-primary bg-primary/5 backdrop-blur-sm text-xs md:text-sm"
              >
                {g}
              </Badge>
            ))}
          </motion.div>

          {/* Title */}
          <motion.h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {movie.title}
          </motion.h1>

          {/* Description */}
          <motion.p 
            className="text-sm sm:text-base md:text-lg text-muted-foreground line-clamp-2 sm:line-clamp-3 max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {movie.description}
          </motion.p>

          {/* Metadata */}
          <motion.div 
            className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              <span className="font-medium">{movie.duration_minutes} min</span>
            </div>
            {movie.rating && movie.rating > 0 && (
              <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-accent text-accent" />
                <span className="font-medium">{movie.rating}/10</span>
              </div>
            )}
            {movie.director && (
              <div className="text-muted-foreground hidden sm:block">
                Directed by <span className="text-foreground font-medium">{movie.director}</span>
              </div>
            )}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Button 
              asChild 
              size="lg" 
              className="cinema-gradient btn-professional shadow-lg shadow-primary/25 h-12 px-8 text-base"
            >
              <Link to={`/movie/${movie.id}`}>
                <Play className="h-5 w-5 mr-2 fill-current" />
                Book Tickets
              </Link>
            </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="h-12 px-8 text-base bg-background/50 backdrop-blur-sm border-border/50 hover:bg-background/80"
            >
              <Link to={`/movie/${movie.id}`}>View Details</Link>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade for seamless transition */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
