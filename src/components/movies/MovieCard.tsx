import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Clock, Star, Play, Ticket, DollarSign, Flame, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Movie } from '@/types/database';

interface MovieCardProps {
  movie: Movie & { budget?: number; revenue?: number };
  index?: number;
}

const isNowShowing = (releaseDate: string | null): boolean => {
  if (!releaseDate) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const release = new Date(releaseDate);
  release.setHours(0, 0, 0, 0);
  return release <= today;
};

const isNewRelease = (releaseDate: string | null): boolean => {
  if (!releaseDate) return false;
  const today = new Date();
  const release = new Date(releaseDate);
  const diffDays = (today.getTime() - release.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 30;
};

const formatCompact = (n: number): string => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

export function MovieCard({ movie, index = 0 }: MovieCardProps) {
  const nowShowing = isNowShowing(movie.release_date);
  const newRelease = isNewRelease(movie.release_date);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { stiffness: 250, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { stiffness: 250, damping: 25 });
  const glareX = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);
  const glareBackground = useTransform(
    [glareX, glareY],
    ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, hsl(var(--primary) / 0.12) 0%, transparent 55%)`
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  const extMovie = movie as any;
  const hasRevenue = extMovie.revenue && extMovie.revenue > 0;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.04,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 800,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <Card className="group overflow-hidden bg-card border-border/20 hover:border-primary/25 transition-all duration-500 glow-card h-full flex flex-col rounded-2xl">
        <div className="relative w-full overflow-hidden" style={{ paddingBottom: '150%' }}>
          <img
            src={movie.poster_url || '/placeholder.svg'}
            alt={`${movie.title} movie poster`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          
          {/* Holographic glare on hover */}
          {isHovered && (
            <motion.div
              className="absolute inset-0 pointer-events-none z-10"
              style={{ background: glareBackground }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
          
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* NEW RELEASE badge — animated pulse glow */}
          {nowShowing && newRelease && (
            <div className="absolute top-3 left-3 z-20">
              <motion.div
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: index * 0.04 + 0.3 }}
              >
                <Badge className="new-release-badge text-[8px] font-black px-2.5 py-1.5 rounded-full border-0 uppercase tracking-[0.2em] shadow-lg gap-1">
                  <Zap className="h-2.5 w-2.5 fill-current" />
                  New
                </Badge>
              </motion.div>
            </div>
          )}

          {/* Rating badge */}
          {nowShowing && movie.rating && movie.rating > 0 && (
            <motion.div 
              className="absolute top-3 right-3 flex items-center gap-1.5 glass-card px-2.5 py-1.5 rounded-full shadow-xl z-20"
              whileHover={{ scale: 1.05 }}
            >
              <Star className="h-3 w-3 fill-accent text-accent" />
              <span className="text-[11px] font-bold tracking-tight">{movie.rating}</span>
            </motion.div>
          )}

          {/* Coming Soon badge */}
          {!nowShowing && (
            <div className="absolute top-3 left-3 z-20">
              <Badge className="cinema-gradient text-primary-foreground text-[9px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-primary/25 border-0 uppercase tracking-[0.15em]">
                Coming Soon
              </Badge>
            </div>
          )}

          {/* Revenue badge on hover */}
          {hasRevenue && (
            <div className="absolute bottom-14 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 z-20">
              <div className="flex items-center gap-1.5 glass-card px-2.5 py-1.5 rounded-lg text-[10px]">
                <DollarSign className="h-3 w-3 text-accent" />
                <span className="font-semibold">{formatCompact(extMovie.revenue)}</span>
                <span className="text-muted-foreground">box office</span>
              </div>
            </div>
          )}

          {/* Genre tags on hover */}
          {movie.genre && movie.genre.length > 0 && !newRelease && (
            <div className="absolute top-3 left-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
              {nowShowing && movie.genre.slice(0, 2).map((g) => (
                <span key={g} className="text-[9px] font-semibold glass-card px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Hover action button — stable element, no re-mount */}
          <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-500 ease-out z-20">
            <Button 
              asChild 
              variant="cinema"
              className="w-full h-10 rounded-full text-sm font-bold"
            >
              <Link to={`/movie/${movie.id}`} className="flex items-center justify-center gap-2">
                {nowShowing ? <Ticket className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                {nowShowing ? 'Book Now' : 'View Details'}
              </Link>
            </Button>
          </div>
        </div>

        <CardContent className="p-3.5 sm:p-4 space-y-2.5 flex-1 flex flex-col bg-card">
          <div className="flex-1">
            <h3 className="font-bold text-sm sm:text-[15px] line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-snug">
              {movie.title}
            </h3>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 shrink-0 text-primary/60" />
              <span className="font-medium">{movie.duration_minutes} min</span>
            </div>
            {nowShowing && newRelease ? (
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] flex items-center gap-1">
                <Flame className="h-3 w-3 text-accent" />
                <span className="cinema-gradient-text">New Release</span>
              </span>
            ) : nowShowing ? (
              <span className="text-[9px] font-bold text-primary uppercase tracking-[0.15em]">In Theatres</span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
