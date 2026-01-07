import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Star, Calendar, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ShowtimeSelector } from '@/components/booking/ShowtimeSelector';
import { MovieTrailer } from '@/components/movies/MovieTrailer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={movie.backdrop_url || movie.poster_url || '/placeholder.svg'}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
          </div>

          <div className="relative container mx-auto px-4 h-full flex items-end pb-8">
            <div className="flex gap-6 items-end">
              <img
                src={movie.poster_url || '/placeholder.svg'}
                alt={movie.title}
                className="w-32 md:w-48 rounded-lg shadow-2xl hidden sm:block"
              />
              <div className="space-y-4">
                <Button variant="ghost" size="sm" asChild className="mb-2">
                  <Link to="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Link>
                </Button>
                <h1 className="text-3xl md:text-5xl font-bold">{movie.title}</h1>
                <div className="flex flex-wrap gap-2">
                  {movie.genre.map((g) => (
                    <Badge key={g} variant="secondary">
                      {g}
                    </Badge>
                  ))}
                </div>
                <MovieTrailer trailerKey={trailerKey} movieTitle={movie.title} />
              </div>
            </div>
          </div>
        </section>

        {/* Movie Info */}
        <section className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Details */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{movie.duration_minutes} minutes</span>
                </div>
                {movie.rating && movie.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span>{movie.rating}/10</span>
                  </div>
                )}
                {movie.release_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(parseISO(movie.release_date), 'MMMM d, yyyy')}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Synopsis</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {movie.description || 'No description available.'}
                </p>
              </div>

              {/* Cast */}
              {movie.cast_members && movie.cast_members.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Cast
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {movie.cast_members.map((actor) => (
                      <Badge key={actor} variant="outline">
                        {actor}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Director */}
              {movie.director && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Director</h2>
                  <p className="text-muted-foreground">{movie.director}</p>
                </div>
              )}

              {/* Showtimes */}
              {movie.status === 'now_showing' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Select Showtime</h2>
                  <ShowtimeSelector
                    showtimes={showtimes}
                    selectedShowtime={selectedShowtime}
                    onSelect={setSelectedShowtime}
                  />
                </div>
              )}
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1">
              {movie.status === 'now_showing' ? (
                <div className="sticky top-20 p-6 rounded-lg bg-card border border-border">
                  <h3 className="text-lg font-semibold mb-4">Book Tickets</h3>
                  {selectedShowtime ? (
                    <div className="space-y-4">
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
                          {selectedShowtime.screen?.theatre?.name}
                        </p>
                      </div>
                      <Button
                        onClick={handleProceedToSeats}
                        className="w-full cinema-gradient"
                        size="lg"
                      >
                        Select Seats
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Select a showtime to proceed with booking
                    </p>
                  )}
                </div>
              ) : (
                <div className="sticky top-20 p-6 rounded-lg bg-card border border-border text-center">
                  <Badge variant="secondary" className="mb-4">Coming Soon</Badge>
                  <p className="text-sm text-muted-foreground">
                    This movie is not yet available for booking.
                    {movie.release_date && (
                      <span className="block mt-2">
                        Expected release: {format(parseISO(movie.release_date), 'MMMM d, yyyy')}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
