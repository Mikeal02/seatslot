import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, Ticket, DollarSign, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Movie } from '@/types/database';

interface FeaturedSpotlightProps {
  movies: Movie[];
}

const formatCompact = (n: number): string => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return '';
};

export function FeaturedSpotlight({ movies }: FeaturedSpotlightProps) {
  const featured = movies
    .filter(m => m.poster_url && m.backdrop_url)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3);

  if (featured.length === 0) return null;

  const hero = featured[0];
  const sidekicks = featured.slice(1);

  const heroExt = hero as any;
  const hasRevenue = heroExt.revenue && heroExt.revenue > 0;

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--primary)/0.04)_0%,transparent_50%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="section-label mb-4">Curated for you</p>
          <div className="flex items-center gap-4">
            <div className="section-header-icon">
              <Star />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black">
                Editor's <span className="cinema-gradient-text">Picks</span>
              </h2>
              <p className="text-muted-foreground text-sm mt-1.5">Handpicked top-rated films for you</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Main featured card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Link to={`/movie/${hero.id}`} className="group block">
              <div className="relative rounded-3xl overflow-hidden glow-card border border-border/20 aspect-[4/3]">
                <img
                  src={hero.backdrop_url || hero.poster_url || '/placeholder.svg'}
                  alt={hero.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-card/60 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {hero.genre.slice(0, 3).map(g => (
                      <Badge key={g} variant="secondary" className="glass-card text-[10px] font-semibold uppercase tracking-wider">
                        {g}
                      </Badge>
                    ))}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black group-hover:text-primary transition-colors duration-300">
                    {hero.title}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 max-w-lg leading-relaxed">
                    {hero.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm">
                    {hero.rating && hero.rating > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 fill-accent text-accent" />
                        <span className="font-bold">{hero.rating}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{hero.duration_minutes}m</span>
                    </div>
                    {hasRevenue && (
                      <div className="flex items-center gap-1.5 text-accent">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold">{formatCompact(heroExt.revenue)}</span>
                      </div>
                    )}
                  </div>

                  <Button variant="cinema" className="rounded-full px-6 h-11 text-sm font-bold mt-2 group/btn">
                    <Ticket className="h-4 w-4 mr-2" />
                    Book Now
                    <ChevronRight className="h-3.5 w-3.5 ml-1 transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </Button>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Side cards */}
          <div className="grid grid-cols-1 gap-5">
            {sidekicks.map((movie, i) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * (i + 1) }}
              >
                <Link to={`/movie/${movie.id}`} className="group block">
                  <div className="relative rounded-2xl overflow-hidden glow-card border border-border/20 flex h-[180px] sm:h-[200px]">
                    <div className="relative w-[130px] sm:w-[150px] shrink-0 overflow-hidden">
                      <img
                        src={movie.poster_url || '/placeholder.svg'}
                        alt={movie.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    </div>
                    <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between bg-card">
                      <div>
                        <div className="flex gap-1.5 mb-2.5">
                          {movie.genre.slice(0, 2).map(g => (
                            <span key={g} className="text-[9px] font-semibold bg-muted px-2 py-0.5 rounded-full uppercase tracking-wider">{g}</span>
                          ))}
                        </div>
                        <h3 className="font-bold text-base sm:text-lg group-hover:text-primary transition-colors duration-300 line-clamp-1">
                          {movie.title}
                        </h3>
                        <p className="text-muted-foreground text-xs line-clamp-2 mt-2 leading-relaxed">{movie.description}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {movie.rating && movie.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-accent text-accent" />
                            <span className="font-bold text-foreground">{movie.rating}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {movie.duration_minutes}m
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
