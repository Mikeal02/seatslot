import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronRight, Star, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

  useEffect(() => {
    fetchRecommendations();
  }, [user, currentMovieId, currentGenres]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      let recommendedMovies: Movie[] = [];
      let recommendationReason = '';

      // Strategy 1: If user is logged in, recommend based on their booking history
      if (user) {
        const { data: bookings } = await supabase
          .from('bookings')
          .select(`
            showtime:showtimes(
              movie:movies(genre)
            )
          `)
          .eq('user_id', user.id)
          .limit(10);

        if (bookings && bookings.length > 0) {
          // Extract genres from booked movies
          const bookedGenres: string[] = [];
          bookings.forEach((b: any) => {
            if (b.showtime?.movie?.genre) {
              bookedGenres.push(...b.showtime.movie.genre);
            }
          });

          if (bookedGenres.length > 0) {
            // Find most frequent genres
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
              .neq('id', currentMovieId || '')
              .order('rating', { ascending: false })
              .limit(limit);

            if (movies && movies.length > 0) {
              recommendedMovies = movies as Movie[];
              recommendationReason = `Based on your love for ${topGenres.slice(0, 2).join(' & ')} movies`;
            }
          }
        }
      }

      // Strategy 2: Similar to current movie genres
      if (recommendedMovies.length === 0 && currentGenres.length > 0) {
        const { data: movies } = await supabase
          .from('movies')
          .select('*')
          .overlaps('genre', currentGenres)
          .neq('id', currentMovieId || '')
          .order('rating', { ascending: false })
          .limit(limit);

        if (movies && movies.length > 0) {
          recommendedMovies = movies as Movie[];
          recommendationReason = `Because you're viewing ${currentGenres[0]} movies`;
        }
      }

      // Strategy 3: Top rated movies
      if (recommendedMovies.length === 0) {
        const { data: movies } = await supabase
          .from('movies')
          .select('*')
          .neq('id', currentMovieId || '')
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
  };

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
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(limit)].map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h3 className="text-xl font-semibold">Recommended for You</h3>
        </div>
        <Link to="/movies" className="text-sm text-primary hover:underline flex items-center gap-1">
          View All <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      
      {reason && (
        <p className="text-sm text-muted-foreground">{reason}</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {recommendations.map((movie) => {
          const nowShowing = isNowShowing(movie.release_date);
          return (
            <Link key={movie.id} to={`/movie/${movie.id}`}>
              <Card className="overflow-hidden group hover:border-primary/50 transition-all duration-300">
                <div className="relative aspect-[2/3] overflow-hidden">
                  <img
                    src={movie.poster_url || '/placeholder.svg'}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {movie.rating && movie.rating > 0 && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full">
                      <Star className="h-3 w-3 fill-accent text-accent" />
                      <span className="text-xs font-medium">{movie.rating.toFixed(1)}</span>
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant={nowShowing ? 'default' : 'secondary'} className="text-xs">
                      {nowShowing ? 'Book Now' : 'Coming Soon'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {movie.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{movie.duration_minutes}m</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
