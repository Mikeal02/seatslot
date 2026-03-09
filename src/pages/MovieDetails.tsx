import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Star, Calendar, Users, TrendingUp, Eye, Film, Clapperboard, Globe, Quote, BarChart3, Shield, Tag, Tv, ExternalLink, Languages } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ShowtimeSelector } from '@/components/booking/ShowtimeSelector';
import { MovieTrailer } from '@/components/movies/MovieTrailer';
import { MovieReviews } from '@/components/movies/MovieReviews';
import { MovieRecommendations } from '@/components/movies/MovieRecommendations';
import { MovieFinancials } from '@/components/movies/MovieFinancials';
import { CastCarousel } from '@/components/movies/CastCarousel';
import { SimilarMovies } from '@/components/movies/SimilarMovies';
import { WishlistButton } from '@/components/movies/WishlistButton';
import { SocialShare } from '@/components/movies/SocialShare';
import { MetaTags } from '@/components/MetaTags';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Movie, Showtime } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

interface TMDBDetails {
  tagline?: string;
  original_title?: string | null;
  status?: string | null;
  homepage?: string | null;
  budget?: number;
  revenue?: number;
  budget_formatted?: string;
  revenue_formatted?: string;
  profit_formatted?: string;
  roi?: number | null;
  revenue_multiplier?: number | null;
  is_profitable?: boolean;
  production_companies?: { name: string; logo: string | null; country: string }[];
  production_countries?: string[];
  spoken_languages?: string[];
  writers?: { name: string; job: string }[];
  composers?: string[];
  cinematographers?: string[];
  editors?: string[];
  director?: { name: string; photo: string | null } | null;
  cast_details?: { id?: number; name: string; character: string; photo: string | null; popularity?: number; department?: string }[];
  similar_movies?: any[];
  recommended_movies?: any[];
  collection?: { id: number; name: string; poster_url: string | null; backdrop_url: string | null } | null;
  tmdb_id?: number;
  original_language?: string;
  certification?: { certification: string; country: string } | null;
  keywords?: string[];
  backdrops?: string[];
  logos?: string[];
  streaming_providers?: { name: string; logo: string }[];
  rent_buy_providers?: { name: string; logo: string; type: string }[];
  external_ids?: { imdb_id: string | null; facebook_id: string | null; instagram_id: string | null; twitter_id: string | null };
  all_videos?: { key: string; name: string; type: string; official: boolean }[];
}

export default function MovieDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [tmdbDetails, setTmdbDetails] = useState<TMDBDetails>({});
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState({ count: 0, avg: 0 });
  const [bookingCount, setBookingCount] = useState(0);

  useEffect(() => {
    if (id) fetchMovieDetails();
  }, [id]);

  const fetchMovieDetails = async () => {
    try {
      const { data: movieData, error: movieError } = await supabase
        .from('movies')
        .select('*')
        .eq('id', id)
        .single();

      if (movieError) throw movieError;
      setMovie(movieData as Movie);
      
      if (movieData.trailer_key) {
        setTrailerKey(movieData.trailer_key);
      }

      // Fetch TMDB rich details in background
      fetchTMDBRichDetails(movieData.title, movieData.trailer_key);

      // Fetch showtimes
      const { data: showtimeData, error: showtimeError } = await supabase
        .from('showtimes')
        .select(`*, screen:screens(*, theatre:theatres(*))`)
        .eq('movie_id', id)
        .gte('show_date', new Date().toISOString().split('T')[0])
        .order('show_date')
        .order('show_time');

      if (showtimeError) throw showtimeError;
      setShowtimes((showtimeData || []) as Showtime[]);

      // Fetch review stats
      const { data: reviews } = await supabase.from('reviews').select('rating').eq('movie_id', id);
      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        setReviewStats({ count: reviews.length, avg: Math.round(avg * 10) / 10 });
      }

      // Fetch booking count
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
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load movie details.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTMDBRichDetails = useCallback(async (title: string, existingTrailerKey: string | null) => {
    try {
      // Search for the movie to get TMDB ID
      const searchRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-movies?action=search&query=${encodeURIComponent(title)}`,
        { headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
      );
      if (!searchRes.ok) return;
      const searchData = await searchRes.json();
      if (!searchData.movies?.[0]?.tmdb_id) return;

      const tmdbId = searchData.movies[0].tmdb_id;

      // Fetch full details
      const detailsRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-movies?action=details&movie_id=${tmdbId}`,
        { headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
      );
      if (!detailsRes.ok) return;
      const details = await detailsRes.json();

      setTmdbDetails({
        tagline: details.tagline,
        original_title: details.original_title,
        status: details.status,
        homepage: details.homepage,
        budget: details.budget,
        revenue: details.revenue,
        budget_formatted: details.budget_formatted,
        revenue_formatted: details.revenue_formatted,
        profit_formatted: details.profit_formatted,
        roi: details.roi,
        revenue_multiplier: details.revenue_multiplier,
        is_profitable: details.is_profitable,
        production_companies: details.production_companies,
        production_countries: details.production_countries,
        spoken_languages: details.spoken_languages,
        writers: details.writers,
        composers: details.composers,
        cinematographers: details.cinematographers,
        editors: details.editors,
        director: details.director,
        cast_details: details.cast_details,
        similar_movies: details.similar_movies,
        recommended_movies: details.recommended_movies,
        collection: details.collection,
        tmdb_id: tmdbId,
        original_language: details.original_language,
        certification: details.certification,
        keywords: details.keywords,
        backdrops: details.backdrops,
        logos: details.logos,
        streaming_providers: details.streaming_providers,
        rent_buy_providers: details.rent_buy_providers,
        external_ids: details.external_ids,
        all_videos: details.all_videos,
      });

      if (!existingTrailerKey && details.trailer_key) {
        setTrailerKey(details.trailer_key);
      }
    } catch (error) {
      console.error('Error fetching TMDB details:', error);
    }
  }, []);

  const handleProceedToSeats = () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to book tickets.' });
      navigate('/auth');
      return;
    }
    if (!selectedShowtime) {
      toast({ variant: 'destructive', title: 'Select a showtime', description: 'Please select a showtime to proceed.' });
      return;
    }
    navigate(`/booking/${selectedShowtime.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <Skeleton className="h-[55vh] w-full" />
          <div className="container mx-auto px-4 py-8 space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
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
            <Button asChild><Link to="/">Go back home</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const langMap: Record<string, string> = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', ja: 'Japanese', ko: 'Korean', zh: 'Chinese', hi: 'Hindi', pt: 'Portuguese', it: 'Italian', ru: 'Russian' };

  return (
    <motion.div 
      className="min-h-screen flex flex-col bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <MetaTags
        title={movie.title}
        description={movie.description || undefined}
        image={movie.poster_url || movie.backdrop_url || undefined}
        movie={movie}
        type="movie"
      />
      <Header />

      <main id="main-content" className="flex-1">
        {/* Cinematic Hero */}
        <section className="relative h-[60vh] min-h-[480px] overflow-hidden">
          <motion.div 
            className="absolute inset-0"
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          >
            <img
              src={movie.backdrop_url || movie.poster_url || '/placeholder.svg'}
              alt={`${movie.title} backdrop`}
              loading="eager"
              className="w-full h-full object-cover"
            />
            {/* Multi-layer gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/30 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,transparent_50%,hsl(var(--background))_100%)]" />
            {/* Film grain */}
            <div className="absolute inset-0 noise-overlay pointer-events-none" />
          </motion.div>

          <div className="relative container mx-auto px-4 h-full flex items-end pb-10">
            <div className="flex gap-6 md:gap-8 items-end w-full">
              <motion.div
                className="hidden sm:block relative"
                initial={{ opacity: 0, y: 40, rotateY: -10 }}
                animate={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                style={{ perspective: 800 }}
              >
                <img
                  src={movie.poster_url || '/placeholder.svg'}
                  alt={`${movie.title} poster`}
                  loading="eager"
                  className="w-36 md:w-52 rounded-xl shadow-2xl border-2 border-border/10"
                />
                {/* Poster reflection */}
                <div className="absolute -bottom-3 left-2 right-2 h-8 rounded-b-xl bg-gradient-to-b from-foreground/5 to-transparent blur-sm" />
              </motion.div>

              <motion.div 
                className="space-y-4 flex-1 min-w-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {/* Action bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="ghost" size="sm" asChild className="bg-background/30 backdrop-blur-sm">
                    <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
                  </Button>
                  <WishlistButton movieId={movie.id} movieTitle={movie.title} variant="outline" className="bg-background/30 backdrop-blur-sm hover:bg-background/60" />
                  <SocialShare title={movie.title} description={movie.description || `Watch ${movie.title}`} variant="outline" />
                </div>

                {/* Tagline */}
                {tmdbDetails.tagline && (
                  <motion.div 
                    className="flex items-center gap-2 text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <Quote className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                    <span className="text-sm italic">{tmdbDetails.tagline}</span>
                  </motion.div>
                )}

                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black drop-shadow-lg tracking-tight leading-none">{movie.title}</h1>
                
                <div className="flex flex-wrap gap-2">
                  {movie.genre.map((g) => (
                    <Badge key={g} variant="secondary" className="backdrop-blur-sm bg-secondary/80 font-medium">{g}</Badge>
                  ))}
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {movie.rating && movie.rating > 0 && (
                    <div className="flex items-center gap-1.5 bg-background/30 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/10">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="font-bold">{movie.rating}/10</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 bg-background/30 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/10">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-medium">{movie.duration_minutes} min</span>
                  </div>
                  {movie.release_date && (
                    <div className="flex items-center gap-1.5 bg-background/30 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/10">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(parseISO(movie.release_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {tmdbDetails.original_language && (
                    <div className="flex items-center gap-1.5 bg-background/30 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/10">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{langMap[tmdbDetails.original_language] || tmdbDetails.original_language.toUpperCase()}</span>
                    </div>
                  )}
                  {reviewStats.count > 0 && (
                    <div className="flex items-center gap-1.5 bg-background/30 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/10">
                      <Eye className="h-4 w-4 text-primary" />
                      <span>{reviewStats.count} review{reviewStats.count !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {bookingCount > 0 && (
                    <div className="flex items-center gap-1.5 bg-background/30 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/10">
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

        {/* Main Content */}
        <section className="container mx-auto px-4 py-6 sm:py-10">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-10">
            <div className="lg:col-span-2">
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-card border border-border/40 p-1 rounded-xl w-full sm:w-auto">
                  <TabsTrigger value="overview" className="rounded-lg text-xs sm:text-sm font-medium">Overview</TabsTrigger>
                  <TabsTrigger value="cast" className="rounded-lg text-xs sm:text-sm font-medium">Cast & Crew</TabsTrigger>
                  <TabsTrigger value="boxoffice" className="rounded-lg text-xs sm:text-sm font-medium">Box Office</TabsTrigger>
                  <TabsTrigger value="reviews" className="rounded-lg text-xs sm:text-sm font-medium">Reviews</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8">
                  {/* Synopsis */}
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <h2 className="text-xl font-bold mb-3">Synopsis</h2>
                    <p className="text-muted-foreground leading-relaxed text-[15px]">
                      {movie.description || 'No description available.'}
                    </p>
                  </motion.div>

                  {/* Director & Writers */}
                  <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {movie.director && (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/30">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Clapperboard className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Director</p>
                          <p className="font-semibold text-sm">{movie.director}</p>
                        </div>
                      </div>
                    )}
                    {tmdbDetails.production_companies && tmdbDetails.production_companies.length > 0 && (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/30">
                        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                          <Film className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Studio</p>
                          <p className="font-semibold text-sm line-clamp-1">{tmdbDetails.production_companies[0].name}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Collection */}
                  {tmdbDetails.collection && (
                    <motion.div
                      className="relative overflow-hidden rounded-2xl border border-border/30 glow-card"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="relative h-32 overflow-hidden">
                        <img
                          src={tmdbDetails.collection.backdrop_url || tmdbDetails.collection.poster_url || '/placeholder.svg'}
                          alt={tmdbDetails.collection.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                      </div>
                      <div className="relative p-4 -mt-8">
                        <Badge className="cinema-gradient text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full border-0 uppercase tracking-wider mb-2">
                          Part of Collection
                        </Badge>
                        <h3 className="font-bold text-lg">{tmdbDetails.collection.name}</h3>
                      </div>
                    </motion.div>
                  )}

                  {/* Quick Cast Preview */}
                  {(tmdbDetails.cast_details || movie.cast_members) && (
                    <CastCarousel cast={tmdbDetails.cast_details || movie.cast_members} />
                  )}

                  {/* Showtimes */}
                  <AnimatePresence>
                    {showtimes.length > 0 ? (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <h2 className="text-xl font-bold mb-4">Select Showtime</h2>
                        <ShowtimeSelector showtimes={showtimes} selectedShowtime={selectedShowtime} onSelect={setSelectedShowtime} />
                      </motion.div>
                    ) : movie.release_date ? (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="p-6 bg-muted/50 rounded-xl border border-border text-center">
                        <h2 className="text-xl font-semibold mb-2">
                          {new Date(movie.release_date) > new Date() ? 'Coming Soon' : 'No Showtimes Available'}
                        </h2>
                        <p className="text-muted-foreground text-sm">
                          {new Date(movie.release_date) > new Date()
                            ? `Expected release: ${format(parseISO(movie.release_date), 'MMMM d, yyyy')}`
                            : 'No showtimes are currently scheduled.'}
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </TabsContent>

                <TabsContent value="cast" className="space-y-6">
                  <CastCarousel cast={tmdbDetails.cast_details || movie.cast_members} />
                  
                  {movie.director && (
                    <div>
                      <h3 className="text-lg font-bold mb-3">Director</h3>
                      <Badge variant="outline" className="py-2 px-4 text-sm">{movie.director}</Badge>
                    </div>
                  )}

                  {tmdbDetails.writers && tmdbDetails.writers.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-3">Writers</h3>
                      <div className="flex flex-wrap gap-2">
                        {tmdbDetails.writers.map(w => (
                          <Badge key={w} variant="outline" className="py-1.5 px-3">{w}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {tmdbDetails.production_companies && tmdbDetails.production_companies.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-3">Production Companies</h3>
                      <div className="flex flex-wrap gap-2">
                        {tmdbDetails.production_companies.map(c => (
                          <Badge key={c} variant="secondary" className="py-1.5 px-3">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="boxoffice" className="space-y-8">
                  <MovieFinancials
                    budget={tmdbDetails.budget}
                    revenue={tmdbDetails.revenue}
                    budgetFormatted={tmdbDetails.budget_formatted}
                    revenueFormatted={tmdbDetails.revenue_formatted}
                    profitFormatted={tmdbDetails.profit_formatted}
                  />
                  
                  {(!tmdbDetails.budget && !tmdbDetails.revenue) && (
                    <div className="text-center py-12 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Box office data not available yet</p>
                      <p className="text-sm mt-1">Financial data will appear once the movie is released</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="reviews">
                  <MovieReviews movieId={movie.id} />
                </TabsContent>
              </Tabs>

              {/* Similar Movies */}
              <div className="mt-10">
                <SimilarMovies movieTitle={movie.title} tmdbId={tmdbDetails.tmdb_id} />
              </div>

              {/* Recommendations */}
              <motion.div 
                className="mt-10"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <MovieRecommendations currentMovieId={movie.id} currentGenres={movie.genre} limit={6} />
              </motion.div>
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1 order-first lg:order-last">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                {showtimes.length > 0 ? (
                  <div className="lg:sticky lg:top-20 p-5 sm:p-6 rounded-2xl bg-card border border-border/30 glow-card space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl cinema-gradient flex items-center justify-center">
                        <Film className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <h3 className="text-lg font-bold">Book Tickets</h3>
                    </div>

                    {/* Movie mini info */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <img src={movie.poster_url || '/placeholder.svg'} alt="" className="w-12 h-16 rounded-lg object-cover" />
                      <div>
                        <p className="font-semibold text-sm line-clamp-1">{movie.title}</p>
                        <p className="text-xs text-muted-foreground">{movie.duration_minutes} min • {movie.genre[0]}</p>
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {selectedShowtime ? (
                        <motion.div key="selected" className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                          <div className="text-sm space-y-2 p-3 rounded-xl bg-muted/30 border border-border/20">
                            <p><span className="text-muted-foreground">Date: </span>{format(parseISO(selectedShowtime.show_date), 'EEEE, MMM d')}</p>
                            <p><span className="text-muted-foreground">Time: </span>{format(parseISO(`2000-01-01T${selectedShowtime.show_time}`), 'h:mm a')}</p>
                            <p><span className="text-muted-foreground">Theatre: </span><span className="break-words">{selectedShowtime.screen?.theatre?.name}</span></p>
                          </div>
                          <Button onClick={handleProceedToSeats} className="w-full cinema-gradient btn-professional h-12 text-base font-bold rounded-xl" size="lg">
                            Select Seats
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.p key="prompt" className="text-sm text-muted-foreground text-center py-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          Select a showtime to proceed
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="lg:sticky lg:top-20 p-5 sm:p-6 rounded-2xl bg-card border border-border/30 glow-card text-center">
                    <Badge variant="secondary" className="mb-4">
                      {movie.release_date && new Date(movie.release_date) > new Date() ? 'Coming Soon' : 'No Showtimes'}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {movie.release_date && new Date(movie.release_date) > new Date() ? (
                        <>Not yet available for booking.<span className="block mt-2">Release: {format(parseISO(movie.release_date), 'MMMM d, yyyy')}</span></>
                      ) : 'No showtimes currently available.'}
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </motion.div>
  );
}

