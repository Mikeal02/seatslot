import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronRight, Star, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Movie } from '@/types/database';

interface MovieRecommendationsProps {
  currentMovieId?: string;
  currentGenres?: string[];
  limit?: number;
}

export function MovieRecommendations({ 
  currentMovieId, 
  currentGenres = [], 
  limit = 6 
}: MovieRecommendationsProps) {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<string>('');

  // Memoize genres to prevent infinite loop from array reference changes
  const genresKey = useMemo(() => currentGenres.join(','), [currentGenres]);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      let recommendedMovies: Movie[] = [];
      let recommendationReason = '';

      if (user) {
        const { data: bookings } = await supabase
          .from('bookings')
          .select(`showtime:showtimes(movie:movies(genre))`)
          .eq('user_id', user.id)
          .limit(10);

        if (bookings && bookings.length > 0) {
          const bookedGenres: string[] = [];
          bookings.forEach((b: any) => {
            if (b.showtime?.movie?.genre) {
              bookedGenres.push(...b.showtime.movie.genre);
            }
          });

          if (bookedGenres.length > 0) {
            const genreCounts = bookedGenres.reduce((acc, g) => {
              acc[g] = (acc[g] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            const topGenres = Object.entries(genreCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([g]) => g);

            const { data: movies } = await supabase
              .from('movies')
              .select('*')
              .overlaps('genre', topGenres)
              .neq('id', currentMovieId || '00000000-0000-0000-0000-000000000000')
              .order('rating', { ascending: false })
              .limit(limit);
            if (movies && movies.length > 0) {
              recommendedMovies = movies as Movie[];
              recommendationReason = `Based on your love for ${topGenres.slice(0, 2).join(' & ')} movies`;
            }
          }
        }
      }

      if (recommendedMovies.length === 0 && currentGenres.length > 0) {
        const { data: movies } = await supabase
          .from('movies')
          .select('*')
          .overlaps('genre', currentGenres)
          .neq('id', currentMovieId || '00000000-0000-0000-0000-000000000000')
          .order('rating', { ascending: false })
          .limit(limit);
        if (movies && movies.length > 0) {
          recommendedMovies = movies as Movie[];
          recommendationReason = `Because you're viewing ${currentGenres[0]} movies`;
        }
      }

      if (recommendedMovies.length === 0) {
        const { data: movies } = await supabase
          .from('movies')
          .select('*')
          .neq('id', currentMovieId || '00000000-0000-0000-0000-000000000000')
          .order('rating', { ascending: false })
          .limit(limit);
        if (movies && movies.length > 0) {
          recommendedMovies = movies as Movie[];
          recommendationReason = 'Top rated movies you might enjoy';
        }
      }

      setRecommendations(recommendedMovies);
      setReason(recommendationReason);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentMovieId, genresKey, limit]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const isNowShowing = (releaseDate: string | null) => {
    if (!releaseDate) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const release = new Date(releaseDate);
    release.setHours(0, 0, 0, 0);
    return release <= today;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-7 w-56" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[2/3] rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl cinema-gradient flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Recommended for You</h3>
            {reason && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{reason}</p>
            )}
          </div>
        </div>
        <Link 
          to="/movies" 
          className="text-sm text-primary hover:text-primary/80 flex items-center gap-1.5 font-medium group"
        >
          View All 
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {recommendations.map((movie, idx) => {
          const nowShowing = isNowShowing(movie.release_date);
          return (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.4 }}
            >
              <Link to={`/movie/${movie.id}`}>
                <Card className="overflow-hidden group hover:border-primary/30 transition-all duration-500 glow-card rounded-xl border-border/40">
                  <div className="relative aspect-[2/3] overflow-hidden">
                    <img
                      src={movie.poster_url || '/placeholder.svg'}
                      alt={movie.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {movie.rating && movie.rating > 0 && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-card/90 backdrop-blur-md px-2 py-1 rounded-full border border-border/30">
                        <Star className="h-3 w-3 fill-accent text-accent" />
                        <span className="text-[11px] font-bold">{movie.rating.toFixed(1)}</span>
                      </div>
                    )}

                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Badge 
                        className={`text-[10px] font-semibold rounded-full ${
                          nowShowing 
                            ? 'cinema-gradient text-primary-foreground' 
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        {nowShowing ? 'Book Now' : 'Coming Soon'}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors duration-300">
                      {movie.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 text-primary/60" />
                      <span>{movie.duration_minutes}m</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
