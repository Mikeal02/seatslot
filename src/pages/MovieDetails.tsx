import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Star, Calendar, Users, TrendingUp, Eye, Film, Clapperboard, Globe, Quote, BarChart3, Shield, Tag, Tv, ExternalLink, Languages, Image as LucideImage } from 'lucide-react';
<<<<<<< HEAD
=======
import { BackButton } from '@/components/nav/BackButton';
>>>>>>> fb2e2f672796a7a90464c9416dfe93e4bfd6758f
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
import { MediaGallery } from '@/components/movies/MediaGallery';
import { StreamingProviders } from '@/components/movies/StreamingProviders';
import { CollectionBanner } from '@/components/movies/CollectionBanner';
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
import { fetchTMDBDetails, isUuid, resolveTMDBMovieId } from '@/lib/movieImport';
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
  posters?: string[];
  logos?: string[];
  streaming_providers?: { name: string; logo: string }[];
  rent_buy_providers?: { name: string; logo: string; type: string }[];
  external_ids?: { imdb_id: string | null; facebook_id: string | null; instagram_id: string | null; twitter_id: string | null };
  all_videos?: { key: string; name: string; type: string; official: boolean }[];
  vote_count?: number;
  popularity?: number;
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
      const movieQuery = supabase.from('movies').select('*');
      const { data: movieData, error: movieError } = isUuid(id || '')
        ? await movieQuery.eq('id', id).single()
        : await movieQuery.eq('tmdb_id', Number(id)).maybeSingle();

      if (movieError) throw movieError;

      // No local row + numeric TMDB id → render directly from TMDB (no DB roundtrip wait)
      if (!movieData && id && !isUuid(id)) {
        const details = await fetchTMDBDetails(Number(id));
        setMovie({
          id: `tmdb-${details.tmdb_id}`,
          title: details.title,
          description: details.description || null,
          poster_url: details.poster_url || null,
          backdrop_url: details.backdrop_url || null,
          duration_minutes: details.duration_minutes || 120,
          rating: details.rating || null,
          genre: details.genre || [],
          cast_members: details.cast_members || [],
          director: typeof details.director === 'string' ? details.director : details.director?.name || null,
          release_date: details.release_date || null,
          status: 'coming_soon',
          trailer_key: details.trailer_key || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Movie);
        setTrailerKey(details.trailer_key || null);
        setTmdbDetailsFromResponse(details, details.tmdb_id);
        setShowtimes([]);
        setLoading(false);
        return;
      }
      if (!movieData) throw new Error('Movie not found');

      // PAINT IMMEDIATELY with movie row — everything else loads in background
      setMovie(movieData as Movie);
      if (movieData.trailer_key) setTrailerKey(movieData.trailer_key);
      setLoading(false);

      // Background: rich TMDB, showtimes, reviews, bookings — all in parallel
      fetchTMDBRichDetails(movieData as Movie & { tmdb_id?: number | null });

      const today = new Date().toISOString().split('T')[0];
      const [showtimeRes, reviewRes] = await Promise.all([
        supabase
          .from('showtimes')
          .select(`*, screen:screens(*, theatre:theatres(*))`)
          .eq('movie_id', movieData.id)
          .gte('show_date', today)
          .order('show_date')
          .order('show_time'),
        supabase.from('reviews').select('rating').eq('movie_id', movieData.id),
      ]);

      const showtimeData = showtimeRes.data || [];
      setShowtimes(showtimeData as Showtime[]);

      const reviews = reviewRes.data || [];
      if (reviews.length > 0) {
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        setReviewStats({ count: reviews.length, avg: Math.round(avg * 10) / 10 });
      }

      const showtimeIds = showtimeData.map((s: any) => s.id);
      if (showtimeIds.length > 0) {
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .in('showtime_id', showtimeIds)
          .eq('booking_status', 'confirmed')
          .then(({ count }) => setBookingCount(count || 0));
      }
    } catch (error) {
      console.error('Error fetching movie details:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load movie details.' });
      setLoading(false);
    }
  };

  const setTmdbDetailsFromResponse = (details: any, tmdbId: number) => {
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
      posters: details.posters,
      logos: details.logos,
      streaming_providers: details.streaming_providers,
      rent_buy_providers: details.rent_buy_providers,
      external_ids: details.external_ids,
      all_videos: details.all_videos,
      vote_count: details.vote_count,
      popularity: details.popularity,
    });
  };

  const fetchTMDBRichDetails = useCallback(async (movieData: Movie & { tmdb_id?: number | null }) => {
    try {
      const tmdbId = await resolveTMDBMovieId({
        tmdbId: movieData.tmdb_id,
        title: movieData.title,
        releaseDate: movieData.release_date,
        posterUrl: movieData.poster_url,
        backdropUrl: movieData.backdrop_url,
      });
      if (!tmdbId) return;
      const details: any = await fetchTMDBDetails(tmdbId);
      setTmdbDetailsFromResponse(details, tmdbId);

      if (!movieData.trailer_key && details.trailer_key) {
        setTrailerKey(details.trailer_key);
      }

      // Self-heal: if local DB runtime/genre/cast looks like a placeholder, refresh it
      const needsRefresh =
        !movieData.tmdb_id ||
        movieData.duration_minutes === 120 ||
        !movieData.genre?.length ||
        !movieData.cast_members?.length;
      if (needsRefresh && isUuid(movieData.id)) {
        await supabase.rpc('import_movie_from_tmdb', {
          p_tmdb_id: tmdbId,
          p_title: details.title || movieData.title,
          p_description: details.description ?? null,
          p_poster_url: details.poster_url ?? null,
          p_backdrop_url: details.backdrop_url ?? null,
          p_release_date: details.release_date ?? null,
          p_duration_minutes: details.duration_minutes || 120,
          p_rating: details.rating ?? null,
          p_genre: details.genre || [],
          p_director: typeof details.director === 'string' ? details.director : details.director?.name ?? null,
          p_cast_members: details.cast_members || [],
          p_trailer_key: details.trailer_key ?? null,
          p_status: movieData.status || 'now_showing',
          p_budget: details.budget || 0,
          p_revenue: details.revenue || 0,
          p_original_language: details.original_language || 'en',
          p_popularity: details.popularity || 0,
        });
        setMovie((prev) => prev ? {
          ...prev,
          tmdb_id: tmdbId,
          duration_minutes: details.duration_minutes || prev.duration_minutes,
          genre: details.genre?.length ? details.genre : prev.genre,
          cast_members: details.cast_members?.length ? details.cast_members : prev.cast_members,
          director: (typeof details.director === 'string' ? details.director : details.director?.name) || prev.director,
        } : prev);
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
  const releaseDate = movie.release_date ? parseISO(movie.release_date) : null;
  const releaseState = releaseDate && releaseDate > new Date() ? 'Upcoming' : 'Released';
  const dataCompleteness = Math.min(100, Math.round([
    movie.description,
    movie.poster_url,
    movie.backdrop_url,
    movie.genre?.length,
    movie.director,
    tmdbDetails.cast_details?.length || movie.cast_members?.length,
    trailerKey,
    tmdbDetails.production_companies?.length,
    tmdbDetails.backdrops?.length,
    tmdbDetails.certification?.certification,
  ].filter(Boolean).length * 10));
  const detailCards = [
    { label: 'TMDB ID', value: tmdbDetails.tmdb_id || movie.tmdb_id || 'Resolving', icon: Shield },
    { label: 'Release', value: releaseDate ? format(releaseDate, 'MMM d, yyyy') : 'TBA', icon: Calendar },
    { label: 'State', value: tmdbDetails.status || releaseState, icon: Tag },
    { label: 'Votes', value: tmdbDetails.vote_count ? tmdbDetails.vote_count.toLocaleString() : 'Fresh import', icon: Users },
    { label: 'Popularity', value: tmdbDetails.popularity ? Math.round(tmdbDetails.popularity).toLocaleString() : 'Live sync', icon: TrendingUp },
    { label: 'Completeness', value: `${dataCompleteness}%`, icon: BarChart3 },
  ];

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

      <main id="main-content" className="flex-1 overflow-x-hidden max-w-[100vw]">
        {/* Cinematic Hero */}
        <section className="relative h-[58vh] min-h-[320px] sm:h-[65vh] sm:min-h-[520px] overflow-hidden">
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

          <div className="relative container mx-auto px-3 sm:px-6 h-full flex items-end pb-10">
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
                  <BackButton />

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

                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black drop-shadow-lg tracking-tighter leading-[0.95]">{movie.title}</h1>
                
                <div className="flex flex-wrap gap-2">
                  {movie.genre.map((g) => (
                    <Badge key={g} variant="secondary" className="backdrop-blur-sm bg-secondary/80 font-medium">{g}</Badge>
                  ))}
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {tmdbDetails.certification && (
                    <div className="flex items-center gap-1.5 bg-background/30 backdrop-blur-sm rounded-full px-3 py-1.5 border border-accent/30">
                      <Shield className="h-4 w-4 text-accent" />
                      <span className="font-bold text-accent">{tmdbDetails.certification.certification}</span>
                    </div>
                  )}
                  {movie.rating && movie.rating > 0 && (
                    <div className="flex items-center gap-1.5 bg-background/30 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/10">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="font-bold">{movie.rating}/10</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 bg-background/30 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/10">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {movie.duration_minutes >= 60
                        ? `${Math.floor(movie.duration_minutes / 60)}h ${movie.duration_minutes % 60}m`
                        : `${movie.duration_minutes} min`}
                    </span>
                  </div>
                  {tmdbDetails.external_ids?.imdb_id && (
                    <a
                      href={`https://www.imdb.com/title/${tmdbDetails.external_ids.imdb_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-background/30 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/10 hover:border-accent/50 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-accent" />
                      <span className="font-bold text-accent">IMDb</span>
                    </a>
                  )}
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

        <section className="border-y border-border/20 bg-card/35 backdrop-blur-xl">
          <div className="container mx-auto px-3 sm:px-6 py-5">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {detailCards.map(({ label, value, icon: Icon }, index) => (
                <motion.div
                  key={label}
                  className="group relative overflow-hidden rounded-xl border border-border/25 bg-background/45 p-4"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <div className="absolute inset-x-0 top-0 h-px cinema-gradient opacity-40" />
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    {label}
                  </div>
                  <p className="mt-2 truncate text-sm font-black text-foreground">{value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container mx-auto px-3 sm:px-6 py-6 sm:py-10">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-10 min-w-0">
            <div className="lg:col-span-2 min-w-0">
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className=" backdrop-blur-xl border border-border/30 p-1.5 rounded-2xl w-full flex flex-wrap gap-2 justify-start rounded-2xl border border-border/30 p-1.5 shadow-lg">
                  <TabsTrigger value="overview" className="rounded-xl text-xs sm:text-sm font-semibold data-[state=active]:cinema-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">Overview</TabsTrigger>
                  <TabsTrigger value="cast" className="rounded-xl text-xs sm:text-sm font-semibold data-[state=active]:cinema-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">Cast & Crew</TabsTrigger>
                  <TabsTrigger value="media" className="rounded-xl text-xs sm:text-sm font-semibold data-[state=active]:cinema-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">Media</TabsTrigger>
                  <TabsTrigger value="boxoffice" className="rounded-xl text-xs sm:text-sm font-semibold data-[state=active]:cinema-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">Box Office</TabsTrigger>
                  <TabsTrigger value="reviews" className="rounded-xl text-xs sm:text-sm font-semibold data-[state=active]:cinema-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">Reviews</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8">
                  {/* Synopsis */}
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-8 w-1 rounded-full cinema-gradient" />
                      <h2 className="text-xl font-black tracking-tight">Synopsis</h2>
                    </div>
                    <p className="text-muted-foreground leading-[1.8] text-[15px] max-w-prose">
                      {movie.description || 'No description available.'}
                    </p>
                  </motion.div>

                  {/* Keywords */}
                  {tmdbDetails.keywords && tmdbDetails.keywords.length > 0 && (
                    <motion.div
                      className="flex flex-wrap gap-1.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 }}
                    >
                      {tmdbDetails.keywords.map(k => (
                        <span key={k} className="text-[10px] px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground border border-border/20 font-medium hover:bg-muted hover:text-foreground transition-colors cursor-default">
                          {k}
                        </span>
                      ))}
                    </motion.div>
                  )}

                  {/* Movie Info Grid */}
                  <motion.div
                    className="relative overflow-hidden rounded-2xl border border-border/25 bg-card/70 p-4 sm:p-5 shadow-lg"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="section-label mb-2">TMDB intelligence</p>
                        <h3 className="text-xl font-black tracking-tight">Verified movie data</h3>
                      </div>
                      <div className="min-w-[180px]">
                        <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                          <span>Profile depth</span>
                          <span>{dataCompleteness}%</span>
                        </div>
                        <Progress value={dataCompleteness} className="h-2" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {movie.director && (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/30 hover:border-primary/20 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Clapperboard className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Director</p>
                          <p className="font-semibold text-sm truncate">{movie.director}</p>
                        </div>
                      </div>
                    )}
                    {tmdbDetails.production_companies && tmdbDetails.production_companies.length > 0 && (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/30 hover:border-primary/20 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                          <Film className="h-4 w-4 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Studio</p>
                          <p className="font-semibold text-sm truncate">{tmdbDetails.production_companies[0].name}</p>
                        </div>
                      </div>
                    )}
                    {tmdbDetails.production_countries && tmdbDetails.production_countries.length > 0 && (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/30 hover:border-primary/20 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Country</p>
                          <p className="font-semibold text-sm truncate">{tmdbDetails.production_countries.join(', ')}</p>
                        </div>
                      </div>
                    )}
                    {tmdbDetails.spoken_languages && tmdbDetails.spoken_languages.length > 0 && (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/30 hover:border-primary/20 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Languages className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Languages</p>
                          <p className="font-semibold text-sm truncate">{tmdbDetails.spoken_languages.join(', ')}</p>
                        </div>
                      </div>
                    )}
                    {tmdbDetails.status && (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/30 hover:border-primary/20 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                          <Tag className="h-4 w-4 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Status</p>
                          <p className="font-semibold text-sm">{tmdbDetails.status}</p>
                        </div>
                      </div>
                    )}
                    {tmdbDetails.vote_count && tmdbDetails.vote_count > 0 && (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/30 hover:border-primary/20 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">TMDB Votes</p>
                          <p className="font-semibold text-sm">{tmdbDetails.vote_count.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    {tmdbDetails.popularity && tmdbDetails.popularity > 0 && (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/30 hover:border-primary/20 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                          <TrendingUp className="h-4 w-4 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Popularity</p>
                          <p className="font-semibold text-sm">{Math.round(tmdbDetails.popularity)}</p>
                        </div>
                      </div>
                    )}
                    {tmdbDetails.homepage && (
                      <a href={tmdbDetails.homepage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/30 hover:border-primary/30 transition-colors group">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <ExternalLink className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Official Site</p>
                          <p className="font-semibold text-sm text-primary group-hover:underline truncate">Visit →</p>
                        </div>
                      </a>
                    )}
                    </div>
                  </motion.div>

                  {/* Collection */}
                  {tmdbDetails.collection && (
                    <CollectionBanner collection={tmdbDetails.collection} />
                  )}

                  {/* Quick Cast Preview */}
                   {(tmdbDetails.cast_details || movie.cast_members) && (
                    <CastCarousel 
                      cast={tmdbDetails.cast_details || movie.cast_members} 
                      director={tmdbDetails.director}
                      composers={tmdbDetails.composers}
                      cinematographers={tmdbDetails.cinematographers}
                      editors={tmdbDetails.editors}
                    />
                  )}

                  {/* Streaming Providers */}
                  <StreamingProviders
                    streaming={tmdbDetails.streaming_providers}
                    rentBuy={tmdbDetails.rent_buy_providers}
                    externalIds={tmdbDetails.external_ids}
                  />

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
                  <CastCarousel 
                    cast={tmdbDetails.cast_details || movie.cast_members} 
                    director={tmdbDetails.director}
                    composers={tmdbDetails.composers}
                    cinematographers={tmdbDetails.cinematographers}
                    editors={tmdbDetails.editors}
                    writers={tmdbDetails.writers}
                  />

                  {tmdbDetails.writers && tmdbDetails.writers.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-3">Writers</h3>
                      <div className="flex flex-wrap gap-2">
                        {tmdbDetails.writers.map((w, i) => (
                          <Badge key={w.name + i} variant="outline" className="py-1.5 px-3">
                            {w.name} <span className="text-muted-foreground ml-1 text-[10px]">({w.job})</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {tmdbDetails.production_companies && tmdbDetails.production_companies.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-3">Production Companies</h3>
                      <div className="flex flex-wrap gap-3">
                        {tmdbDetails.production_companies.map((c, i) => (
                          <div key={c.name + i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/30">
                            {c.logo ? (
                              <img src={c.logo} alt={c.name} className="h-6 object-contain" />
                            ) : null}
                            <span className="text-xs font-medium">{c.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tmdbDetails.spoken_languages && tmdbDetails.spoken_languages.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-3">Languages</h3>
                      <div className="flex flex-wrap gap-2">
                        {tmdbDetails.spoken_languages.map(l => (
                          <Badge key={l} variant="secondary" className="py-1.5 px-3">{l}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="media" className="space-y-8">
                   <MediaGallery
                    backdrops={tmdbDetails.backdrops}
                    posters={tmdbDetails.posters}
                    logos={tmdbDetails.logos}
                    videos={tmdbDetails.all_videos}
                  />
                  {(!tmdbDetails.backdrops?.length && !tmdbDetails.all_videos?.length) && (
                    <div className="text-center py-12 text-muted-foreground">
        <LucideImage className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No media available</p>
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
                    roi={tmdbDetails.roi}
                    revenueMultiplier={tmdbDetails.revenue_multiplier}
                    isProfitable={tmdbDetails.is_profitable}
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

              {/* Similar & Recommended Movies */}
              <div className="mt-10">
                <SimilarMovies 
                  movieTitle={movie.title} 
                  tmdbId={tmdbDetails.tmdb_id} 
                  similarMovies={tmdbDetails.similar_movies}
                  recommendedMovies={tmdbDetails.recommended_movies}
                />
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
            <div className="lg:col-span-1 order-first lg:order-last min-w-0">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                {showtimes.length > 0 ? (
                 <div className="lg:sticky lg:top-20 p-4 sm:p-6 py-6 sm:p-6 rounded-2xl bg-card border border-border/30 glow-card space-y-5 overflow-hidden">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl cinema-gradient flex items-center justify-center">
                        <Film className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <h3 className="text-lg font-bold">Book Tickets</h3>
                    </div>

                    {/* Movie mini info */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <img src={movie.poster_url || '/placeholder.svg'} alt="" className="w-12 h-16 rounded-lg object-cover" />
                      <div className='min-w-0 flex-1'>
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
                            <p><span className="text-muted-foreground">Theatre: </span><span className="break-all">{selectedShowtime.screen?.theatre?.name}</span></p>
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

