import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { TrendingUp, Star, Clock, Ticket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Movie } from '@/types/database';

interface TrendingCarouselProps {
  movies: Movie[];
}

export function TrendingCarousel({ movies }: TrendingCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<number>();
  const scrollPos = useRef(0);

  // Take top 10 trending movies, duplicate for seamless loop
  const trending = movies.slice(0, 10);
  const duplicated = [...trending, ...trending];

  // Parallax on scroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  // Auto-scroll animation
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || trending.length === 0) return;

    const speed = 0.5; // px per frame
    const halfWidth = el.scrollWidth / 2;

    const animate = () => {
      if (!isPaused) {
        scrollPos.current += speed;
        if (scrollPos.current >= halfWidth) {
          scrollPos.current = 0;
        }
        el.scrollLeft = scrollPos.current;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPaused, trending.length]);

  if (trending.length === 0) return null;

  return (
    <section ref={containerRef} className="relative py-16 sm:py-20 overflow-hidden">
      {/* Parallax background layer */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ y: bgY }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-background to-card/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,hsl(var(--primary)/0.06)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,hsl(var(--accent)/0.04)_0%,transparent_60%)]" />
      </motion.div>

      {/* Accent lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/15 to-transparent" />

      <motion.div className="relative z-10" style={{ opacity }}>
        {/* Section header */}
        <div className="container mx-auto px-4 mb-10">
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="h-12 w-12 rounded-xl cinema-gradient flex items-center justify-center shadow-lg shadow-primary/20">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
                Trending <span className="cinema-gradient-text">Now</span>
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                The hottest movies everyone's watching
              </p>
            </div>
          </motion.div>
        </div>

        {/* Auto-scrolling carousel */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-hidden px-4 cursor-grab active:cursor-grabbing"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {duplicated.map((movie, idx) => (
            <TrendingCard key={`${movie.id}-${idx}`} movie={movie} index={idx % trending.length} />
          ))}
        </div>

        {/* Fade edges */}
        <div className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />
      </motion.div>
    </section>
  );
}

function TrendingCard({ movie, index }: { movie: Movie; index: number }) {
  return (
    <Link
      to={`/movie/${movie.id}`}
      className="flex-shrink-0 w-[280px] sm:w-[320px] group"
    >
      <div className="relative rounded-2xl overflow-hidden glow-card border border-border/30 bg-card">
        {/* Poster */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={movie.backdrop_url || movie.poster_url || '/placeholder.svg'}
            alt={movie.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-card/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Rank badge */}
          <div className="absolute top-3 left-3">
            <div className="h-8 w-8 rounded-full cinema-gradient flex items-center justify-center shadow-lg shadow-primary/30 text-primary-foreground text-sm font-black">
              {index + 1}
            </div>
          </div>

          {/* Rating */}
          {movie.rating && movie.rating > 0 && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-card/90 backdrop-blur-xl px-2 py-1 rounded-full border border-border/20">
              <Star className="h-3 w-3 fill-accent text-accent" />
              <span className="text-[11px] font-bold">{movie.rating}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-2">
          <h3 className="font-bold text-sm sm:text-base line-clamp-1 group-hover:text-primary transition-colors duration-300 tracking-tight">
            {movie.title}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-primary/60" />
                {movie.duration_minutes}m
              </span>
              {movie.genre && movie.genre.length > 0 && (
                <span className="text-muted-foreground/70">{movie.genre[0]}</span>
              )}
            </div>
            <Badge className="cinema-gradient text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full border-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg shadow-primary/20">
              <Ticket className="h-2.5 w-2.5 mr-1" />
              Book
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  );
}
