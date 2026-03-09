import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Clock, Star, Sparkles, Ticket, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Movie } from '@/types/database';

interface HeroSectionProps {
  movie: Movie;
}

export function HeroSection({ movie }: HeroSectionProps) {
  return (
    <section className="relative h-[90vh] min-h-[700px] overflow-hidden">
      {/* Background Image with Ken Burns */}
      <motion.div 
        className="absolute inset-0"
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ duration: 18, ease: 'linear' }}
      >
        <img
          src={movie.backdrop_url || movie.poster_url || '/placeholder.svg'}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Multi-layer cinematic overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
      <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-background via-background/95 to-transparent" />
      
      {/* Animated cinematic light leak */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(ellipse at 0% 100%, hsl(var(--primary) / 0.2) 0%, transparent 50%)',
            'radial-gradient(ellipse at 20% 70%, hsl(var(--accent) / 0.15) 0%, transparent 50%)',
            'radial-gradient(ellipse at 10% 90%, hsl(var(--primary) / 0.2) 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />

      {/* Film grain overlay */}
      <div className="absolute inset-0 noise-overlay pointer-events-none" />

      {/* Cinematic top bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] cinema-gradient opacity-60" />

      {/* Content */}
      <div className="relative container mx-auto px-4 h-full flex items-end pb-24 sm:pb-28">
        <div className="max-w-2xl space-y-7">
          {/* Featured Badge */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Badge className="cinema-gradient text-primary-foreground gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.25em] rounded-full shadow-xl shadow-primary/25 border-0">
              <Sparkles className="h-3 w-3" />
              Featured Today
            </Badge>
          </motion.div>

          {/* Title — dramatic entrance */}
          <motion.h1 
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black leading-[0.95]"
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
            <div className="flex items-center gap-2 glass-card px-4 py-2.5 rounded-full text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-semibold">{movie.duration_minutes} min</span>
            </div>
            {movie.rating && movie.rating > 0 && (
              <div className="flex items-center gap-2 glass-card px-4 py-2.5 rounded-full text-sm">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span className="font-semibold">{movie.rating}/10</span>
              </div>
            )}
            {movie.genre && movie.genre.length > 0 && (
              <div className="flex items-center gap-2 glass-card px-4 py-2.5 rounded-full text-sm">
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
              variant="cinema"
              size="xl"
              className="rounded-full group"
            >
              <Link to={`/movie/${movie.id}`}>
                <Ticket className="h-5 w-5 mr-2" />
                Book Tickets
                <ChevronRight className="h-4 w-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button 
              asChild 
              size="xl"
              variant="outline" 
              className="bg-card/15 backdrop-blur-xl border-border/20 hover:bg-card/40 rounded-full"
            >
              <Link to={`/movie/${movie.id}`}>
                <Play className="h-5 w-5 mr-2 fill-current" />
                Watch Trailer
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Bottom vignette line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
    </section>
  );
}
