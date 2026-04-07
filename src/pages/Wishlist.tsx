import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Loader2, Film, Trash2, Calendar, Clock, Star, Ticket, Play, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
        <main className="flex-1 flex items-center justify-center px-4">
          <motion.div 
            className="text-center max-w-md"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="mx-auto mb-8 w-24 h-24 rounded-3xl cinema-gradient flex items-center justify-center shadow-2xl shadow-primary/30"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Heart className="h-10 w-10 text-primary-foreground" />
            </motion.div>
            <h1 className="text-3xl font-black mb-3 cinema-gradient-text">Your Watchlist</h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Sign in to save movies you love and never miss a screening.
            </p>
            <Button asChild size="lg" className="cinema-gradient btn-professional rounded-full px-8 shadow-lg shadow-primary/25">
              <Link to="/auth">Sign In to Continue</Link>
            </Button>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen flex flex-col bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 sm:py-12">
        {/* Premium Header */}
        <motion.div 
          className="flex flex-wrap items-end gap-4 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl cinema-gradient flex items-center justify-center shadow-lg shadow-primary/20">
                <Heart className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">My Watchlist</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              {movies.length > 0 
                ? `${movies.length} ${movies.length === 1 ? 'movie' : 'movies'} saved for later` 
                : 'Your curated collection of must-watch films'
              }
            </p>
          </div>
        </motion.div>

        {loading || wishlistLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-2xl" />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <motion.div
              className="mx-auto mb-8 w-28 h-28 rounded-3xl bg-muted/50 flex items-center justify-center"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Film className="h-12 w-12 text-muted-foreground/50" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-3">No movies yet</h2>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
              Explore our collection and tap the heart icon to save movies you want to watch.
            </p>
            <Button asChild size="lg" className="cinema-gradient btn-professional rounded-full px-8">
              <Link to="/movies">
                <Sparkles className="h-4 w-4 mr-2" />
                Discover Movies
              </Link>
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {movies.map((movie, i) => {
                const nowShowing = isNowShowing(movie.release_date);
                return (
                  <motion.div
                    key={movie.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                  >
                    <Card className="overflow-hidden group hover:border-primary/30 transition-all duration-500 glow-card rounded-2xl">
                      <div className="flex gap-4 p-4">
                        <Link to={`/movie/${movie.id}`} className="shrink-0 relative overflow-hidden rounded-xl">
                          <img
                            src={movie.poster_url || '/placeholder.svg'}
                            alt={movie.title}
                            loading="lazy"
                            className="w-28 h-40 sm:w-32 sm:h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </Link>
                        <div className="flex-1 min-w-0 flex flex-col">
                          <Link to={`/movie/${movie.id}`}>
                            <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors duration-300">
                              {movie.title}
                            </h3>
                          </Link>
                          
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {movie.genre?.slice(0, 3).map((g) => (
                              <Badge key={g} variant="secondary" className="text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                {g}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                            {movie.rating && movie.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                                <span className="font-semibold">{movie.rating.toFixed(1)}</span>
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

                          <div className="mt-auto pt-4 flex items-center gap-2">
                            <Button 
                              asChild 
                              size="sm" 
                              className={nowShowing ? 'cinema-gradient btn-professional rounded-full shadow-md shadow-primary/20' : 'rounded-full'} 
                              variant={nowShowing ? 'default' : 'outline'}
                            >
                              <Link to={`/movie/${movie.id}`} className="flex items-center gap-1.5">
                                {nowShowing ? <Ticket className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                {nowShowing ? 'Book Now' : 'Details'}
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full h-8 w-8 p-0"
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
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </main>
      <Footer />
      <div className="h-16 lg:hidden" />
    </motion.div>
  );
}
