import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Loader2, Film, Trash2, Calendar, Clock, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { Movie } from '@/types/database';
import { format, parseISO } from 'date-fns';

export default function Wishlist() {
  const { user } = useAuth();
  const { wishlist, toggleWishlist, loading: wishlistLoading } = useWishlist();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (wishlist.length > 0) {
      fetchWishlistMovies();
    } else {
      setMovies([]);
      setLoading(false);
    }
  }, [wishlist]);

  const fetchWishlistMovies = async () => {
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .in('id', wishlist);

      if (error) throw error;
      setMovies(data as Movie[]);
    } catch (error) {
      console.error('Error fetching wishlist movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (movieId: string, movieTitle: string) => {
    setRemovingId(movieId);
    await toggleWishlist(movieId, movieTitle);
    setRemovingId(null);
  };

  const isNowShowing = (releaseDate: string | null) => {
    if (!releaseDate) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const release = new Date(releaseDate);
    release.setHours(0, 0, 0, 0);
    return release <= today;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <Heart className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Sign in to view your wishlist</h1>
          <p className="text-muted-foreground mb-6">
            Save your favorite movies and get notified when they're available.
          </p>
          <Button asChild className="cinema-gradient">
            <Link to="/auth">Sign In</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          <h1 className="text-3xl font-bold">My Wishlist</h1>
          {movies.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {movies.length} {movies.length === 1 ? 'movie' : 'movies'}
            </Badge>
          )}
        </div>

        {loading || wishlistLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-16">
            <Film className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">
              Start adding movies you'd like to watch!
            </p>
            <Button asChild className="cinema-gradient">
              <Link to="/movies">Browse Movies</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {movies.map((movie) => {
              const nowShowing = isNowShowing(movie.release_date);
              return (
                <Card key={movie.id} className="overflow-hidden group hover:border-primary/50 transition-colors">
                  <div className="flex gap-4 p-4">
                    <Link to={`/movie/${movie.id}`} className="shrink-0">
                      <img
                        src={movie.poster_url || '/placeholder.svg'}
                        alt={movie.title}
                        className="w-24 h-36 object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/movie/${movie.id}`}>
                        <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors">
                          {movie.title}
                        </h3>
                      </Link>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {movie.genre.slice(0, 2).map((g) => (
                          <Badge key={g} variant="secondary" className="text-xs">
                            {g}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex flex-col gap-1 mt-3 text-sm text-muted-foreground">
                        {movie.rating && movie.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                            <span>{movie.rating.toFixed(1)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{movie.duration_minutes} min</span>
                        </div>
                        {movie.release_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{format(parseISO(movie.release_date), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button asChild size="sm" className={nowShowing ? 'cinema-gradient' : ''} variant={nowShowing ? 'default' : 'outline'}>
                          <Link to={`/movie/${movie.id}`}>
                            {nowShowing ? 'Book Now' : 'View Details'}
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemove(movie.id, movie.title)}
                          disabled={removingId === movie.id}
                        >
                          {removingId === movie.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
