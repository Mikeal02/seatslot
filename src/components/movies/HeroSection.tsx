import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Clock, Star, Sparkles, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Movie } from '@/types/database';

interface HeroSectionProps {
  movie: Movie;
}

export function HeroSection({ movie }: HeroSectionProps) {
  return (
    <section className="relative h-[85vh] min-h-[650px] overflow-hidden">
      {/* Background Image with Ken Burns */}
      <motion.div 
        className="absolute inset-0"
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ duration: 12, ease: 'linear' }}
      >
        <img
          src={movie.backdrop_url || movie.poster_url || '/placeholder.svg'}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Cinematic overlay layers */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background via-background/90 to-transparent" />
      
      {/* Animated cinematic light leak */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(ellipse at 0% 100%, hsl(var(--primary) / 0.25) 0%, transparent 50%)',
            'radial-gradient(ellipse at 20% 70%, hsl(var(--accent) / 0.2) 0%, transparent 50%)',
            'radial-gradient(ellipse at 10% 90%, hsl(var(--primary) / 0.25) 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Film grain overlay */}
      <div className="absolute inset-0 noise-overlay pointer-events-none" />

      {/* Letterbox bars for cinematic feel */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-accent/30 to-primary/40" />

      {/* Content */}
      <div className="relative container mx-auto px-4 h-full flex items-end pb-20 sm:pb-24">
        <div className="max-w-2xl space-y-6">
          {/* Featured Badge */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Badge className="cinema-gradient text-primary-foreground gap-2 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] rounded-full shadow-xl shadow-primary/30 border-0">
              <Sparkles className="h-3.5 w-3.5" />
              Featured Today
            </Badge>
          </motion.div>

          {/* Title with dramatic entrance */}
          <motion.h1 
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-[-0.04em]"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <span className="block">{movie.title}</span>
          </motion.h1>

          {/* Description */}
          <motion.p 
            className="text-sm sm:text-base md:text-lg text-muted-foreground line-clamp-2 max-w-xl leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {movie.description}
          </motion.p>

          {/* Metadata pills */}
          <motion.div 
            className="flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="flex items-center gap-2 bg-card/50 backdrop-blur-xl px-4 py-2 rounded-full border border-border/20 text-sm shadow-lg">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-semibold">{movie.duration_minutes} min</span>
            </div>
            {movie.rating && movie.rating > 0 && (
              <div className="flex items-center gap-2 bg-card/50 backdrop-blur-xl px-4 py-2 rounded-full border border-border/20 text-sm shadow-lg">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span className="font-semibold">{movie.rating}/10</span>
              </div>
            )}
            {movie.genre && movie.genre.length > 0 && (
              <div className="flex items-center gap-2 bg-card/50 backdrop-blur-xl px-4 py-2 rounded-full border border-border/20 text-sm shadow-lg">
                <span className="font-semibold">{movie.genre.slice(0, 2).join(' · ')}</span>
              </div>
            )}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-3 pt-2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.85 }}
          >
            <Button 
              asChild 
              size="lg" 
              className="cinema-gradient btn-professional shadow-2xl shadow-primary/30 h-14 px-10 text-base font-bold rounded-full tracking-wide"
            >
              <Link to={`/movie/${movie.id}`}>
                <Ticket className="h-5 w-5 mr-2.5" />
                Book Tickets
              </Link>
            </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="h-14 px-10 text-base font-semibold bg-card/20 backdrop-blur-xl border-border/30 hover:bg-card/50 rounded-full"
            >
              <Link to={`/movie/${movie.id}`}>
                <Play className="h-5 w-5 mr-2 fill-current" />
                Watch Trailer
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
