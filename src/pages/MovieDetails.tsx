import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Star, Calendar, Users, TrendingUp, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ShowtimeSelector } from '@/components/booking/ShowtimeSelector';
import { MovieTrailer } from '@/components/movies/MovieTrailer';
import { MovieReviews } from '@/components/movies/MovieReviews';
import { MovieRecommendations } from '@/components/movies/MovieRecommendations';
import { WishlistButton } from '@/components/movies/WishlistButton';
import { SocialShare } from '@/components/movies/SocialShare';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Movie, Showtime } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

export default function MovieDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState({ count: 0, avg: 0 });
  const [bookingCount, setBookingCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchMovieDetails();
    }
  }, [id]);

  const fetchMovieDetails = async () => {
    try {
      // Fetch movie
      const { data: movieData, error: movieError } = await supabase
        .from('movies')
        .select('*')
        .eq('id', id)
        .single();

      if (movieError) throw movieError;
      setMovie(movieData as Movie);
      
      // Check if movie has trailer_key, if not try to fetch from TMDB
      if (movieData.trailer_key) {
        setTrailerKey(movieData.trailer_key);
      } else {
        // Try to fetch trailer from TMDB
        fetchTrailerFromTMDB(movieData.title);
      }

      // Fetch showtimes with screen and theatre info
      const { data: showtimeData, error: showtimeError } = await supabase
        .from('showtimes')
        .select(`
          *,
          screen:screens(
            *,
            theatre:theatres(*)
          )
        `)
        .eq('movie_id', id)
        .gte('show_date', new Date().toISOString().split('T')[0])
        .order('show_date')
        .order('show_time');

      if (showtimeError) throw showtimeError;
      setShowtimes(showtimeData as Showtime[]);

      // Fetch review stats
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('movie_id', id);
      
      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        setReviewStats({ count: reviews.length, avg: Math.round(avg * 10) / 10 });
      }

      // Fetch booking count for popularity
      const showtimeIds = (showtimeData || []).map((s: any) => s.id);
      if (showtimeIds.length > 0) {
        const { count } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .in('showtime_id', showtimeIds)
          .eq('booking_status', 'confirmed');
        setBookingCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching movie details:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load movie details.',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrailerFromTMDB = async (title: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-movies?action=search&query=${encodeURIComponent(title)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      
      if (!res.ok) return;
      
      const data = await res.json();
      if (data.movies?.[0]?.tmdb_id) {
        // Fetch details with trailer
        const detailsRes = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-movies?action=details&movie_id=${data.movies[0].tmdb_id}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );
        
        if (detailsRes.ok) {
          const details = await detailsRes.json();
          if (details.trailer_key) {
            setTrailerKey(details.trailer_key);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching trailer:', error);
    }
  };

  const handleProceedToSeats = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to book tickets.',
      });
      navigate('/auth');
      return;
    }

    if (!selectedShowtime) {
      toast({
        variant: 'destructive',
        title: 'Select a showtime',
        description: 'Please select a showtime to proceed.',
      });
      return;
    }

    navigate(`/booking/${selectedShowtime.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <Skeleton className="h-[50vh] w-full" />
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-full max-w-2xl mb-8" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Movie not found</h1>
            <Button asChild>
              <Link to="/">Go back home</Link>
            </Button>
          </div>
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
      transition={{ duration: 0.3 }}
    >
      <Header />

      <main className="flex-1">
        {/* Hero Section with Parallax */}
        <section className="relative h-[55vh] min-h-[420px] overflow-hidden">
          <motion.div 
            className="absolute inset-0"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <img
              src={movie.backdrop_url || movie.poster_url || '/placeholder.svg'}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
          </motion.div>

          <div className="relative container mx-auto px-4 h-full flex items-end pb-8">
            <div className="flex gap-6 items-end w-full">
              <motion.img
                src={movie.poster_url || '/placeholder.svg'}
                alt={movie.title}
                className="w-32 md:w-48 rounded-lg shadow-2xl hidden sm:block border-2 border-border/20"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              />
              <motion.div 
                className="space-y-4 flex-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Button variant="ghost" size="sm" asChild className="bg-background/30 backdrop-blur-sm">
                    <Link to="/">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Link>
                  </Button>
                  <WishlistButton 
                    movieId={movie.id} 
                    movieTitle={movie.title}
                    variant="outline"
                    className="bg-background/30 backdrop-blur-sm hover:bg-background/60"
                  />
                  <SocialShare 
                    title={movie.title}
                    description={movie.description || `Watch ${movie.title} - ${movie.genre.join(', ')}`}
                    variant="outline"
                  />
                </div>
                <h1 className="text-3xl md:text-5xl font-bold drop-shadow-lg">{movie.title}</h1>
                <div className="flex flex-wrap gap-2">
                  {movie.genre.map((g) => (
                    <Badge key={g} variant="secondary" className="backdrop-blur-sm bg-secondary/80">
                      {g}
                    </Badge>
                  ))}
                </div>

                {/* Quick Stats Row */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {movie.rating && movie.rating > 0 && (
                    <div className="flex items-center gap-1.5 bg-background/30 backdrop-blur-sm rounded-full px-3 py-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="font-semibold">{movie.rating}/10</span>
                    </div>
                  )}
                  {reviewStats.count > 0 && (
                    <div className="flex items-center gap-1.5 bg-background/30 backdrop-blur-sm rounded-full px-3 py-1">
                      <Eye className="h-4 w-4 text-primary" />
                      <span>{reviewStats.count} review{reviewStats.count !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {bookingCount > 0 && (
                    <div className="flex items-center gap-1.5 bg-background/30 backdrop-blur-sm rounded-full px-3 py-1">
                      <TrendingUp className="h-4 w-4 text-accent" />
                      <span>{bookingCount} booking{bookingCount !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
                
                <MovieTrailer trailerKey={trailerKey} movieTitle={movie.title} />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Movie Info */}
        <section className="container mx-auto px-4 py-4 sm:py-8">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-6 lg:space-y-8">
              {/* Details */}
              <motion.div 
                className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-2 bg-card rounded-lg px-4 py-2 border border-border">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{movie.duration_minutes} minutes</span>
                </div>
                {movie.rating && movie.rating > 0 && (
                  <div className="flex items-center gap-2 bg-card rounded-lg px-4 py-2 border border-border">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span>{movie.rating}/10</span>
                    <Progress value={(movie.rating / 10) * 100} className="w-16 h-1.5" />
                  </div>
                )}
                {movie.release_date && (
                  <div className="flex items-center gap-2 bg-card rounded-lg px-4 py-2 border border-border">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(parseISO(movie.release_date), 'MMMM d, yyyy')}</span>
                  </div>
                )}
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h2 className="text-xl font-semibold mb-3">Synopsis</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {movie.description || 'No description available.'}
                </p>
              </motion.div>

              {/* Cast */}
              {movie.cast_members && movie.cast_members.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Cast
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {movie.cast_members.map((actor) => (
                      <Badge key={actor} variant="outline" className="py-1.5 px-3">
                        {actor}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Director */}
              {movie.director && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75 }}
                >
                  <h2 className="text-xl font-semibold mb-2">Director</h2>
                  <p className="text-muted-foreground">{movie.director}</p>
                </motion.div>
              )}

              {/* Reviews Section */}
              <MovieReviews movieId={movie.id} />

              {/* Showtimes */}
              <AnimatePresence>
                {showtimes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <h2 className="text-xl font-semibold mb-4">Select Showtime</h2>
                    <ShowtimeSelector
                      showtimes={showtimes}
                      selectedShowtime={selectedShowtime}
                      onSelect={setSelectedShowtime}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1 order-first lg:order-last">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                {showtimes.length > 0 ? (
                  <div className="lg:sticky lg:top-20 p-4 sm:p-6 rounded-lg bg-card border border-border glow-card">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Book Tickets</h3>
                    <AnimatePresence mode="wait">
                      {selectedShowtime ? (
                        <motion.div 
                          key="selected"
                          className="space-y-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <div className="text-sm space-y-2">
                            <p>
                              <span className="text-muted-foreground">Date: </span>
                              {format(parseISO(selectedShowtime.show_date), 'EEEE, MMM d')}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Time: </span>
                              {format(parseISO(`2000-01-01T${selectedShowtime.show_time}`), 'h:mm a')}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Theatre: </span>
                              <span className="break-words">{selectedShowtime.screen?.theatre?.name}</span>
                            </p>
                          </div>
                          <Button
                            onClick={handleProceedToSeats}
                            className="w-full cinema-gradient btn-professional"
                            size="lg"
                          >
                            Select Seats
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.p 
                          key="prompt"
                          className="text-sm text-muted-foreground"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          Select a showtime to proceed with booking
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="lg:sticky lg:top-20 p-4 sm:p-6 rounded-lg bg-card border border-border glow-card text-center">
                    <Badge variant="secondary" className="mb-3 sm:mb-4">
                      {movie.release_date && new Date(movie.release_date) > new Date() ? 'Coming Soon' : 'No Showtimes'}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {movie.release_date && new Date(movie.release_date) > new Date() ? (
                        <>
                          This movie is not yet available for booking.
                          <span className="block mt-2">
                            Expected release: {format(parseISO(movie.release_date), 'MMMM d, yyyy')}
                          </span>
                        </>
                      ) : (
                        'No showtimes are currently available for this movie.'
                      )}
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Recommendations Section */}
          <motion.div 
            className="mt-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <MovieRecommendations 
              currentMovieId={movie.id} 
              currentGenres={movie.genre} 
              limit={6}
            />
          </motion.div>
        </section>
      </main>

      <Footer />
    </motion.div>
  );
}
