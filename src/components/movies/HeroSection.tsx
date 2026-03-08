import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Clock, Star, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Movie } from '@/types/database';

interface HeroSectionProps {
  movie: Movie;
}

export function HeroSection({ movie }: HeroSectionProps) {
  return (
    <section className="relative h-[80vh] min-h-[600px] overflow-hidden">
      {/* Background Image */}
      <motion.div 
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <img
          src={movie.backdrop_url || movie.poster_url || '/placeholder.svg'}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        {/* Multi-layer gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />
        
        {/* Animated color wash */}
        <motion.div 
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(ellipse at 0% 100%, hsl(var(--primary) / 0.2) 0%, transparent 60%)',
              'radial-gradient(ellipse at 30% 80%, hsl(var(--accent) / 0.15) 0%, transparent 60%)',
              'radial-gradient(ellipse at 0% 100%, hsl(var(--primary) / 0.2) 0%, transparent 60%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />

        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,hsl(var(--background)/0.4)_100%)]" />
      </motion.div>

      {/* Content */}
      <div className="relative container mx-auto px-4 h-full flex items-end pb-16 sm:pb-20">
        <div className="max-w-2xl space-y-5">
          {/* Featured Badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Badge className="cinema-gradient text-primary-foreground gap-1.5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full">
              <Sparkles className="h-3 w-3" />
              Featured Today
            </Badge>
          </motion.div>

          {/* Title */}
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[0.95] tracking-tighter"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            {movie.title}
          </motion.h1>

          {/* Description */}
          <motion.p 
            className="text-sm sm:text-base text-muted-foreground line-clamp-2 max-w-lg leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            {movie.description}
          </motion.p>

          {/* Metadata chips */}
          <motion.div 
            className="flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
          >
            <div className="flex items-center gap-1.5 bg-card/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/30 text-sm">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">{movie.duration_minutes} min</span>
            </div>
            {movie.rating && movie.rating > 0 && (
              <div className="flex items-center gap-1.5 bg-card/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/30 text-sm">
                <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                <span className="font-medium">{movie.rating}/10</span>
              </div>
            )}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-3 pt-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.75 }}
          >
            <Button 
              asChild 
              size="lg" 
              className="cinema-gradient btn-professional shadow-lg shadow-primary/25 h-13 px-8 text-base rounded-full"
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
              className="h-13 px-8 text-base bg-card/30 backdrop-blur-sm border-border/40 hover:bg-card/60 rounded-full"
            >
              <Link to={`/movie/${movie.id}`}>View Details</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
