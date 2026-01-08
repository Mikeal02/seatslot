import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, X, Loader2, Ticket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MovieCard } from '@/components/movies/MovieCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Movie } from '@/types/database';
import { useTMDB } from '@/hooks/useTMDB';
import { useToast } from '@/hooks/use-toast';

const GENRE_LIST = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
  'Romance', 'Science Fiction', 'Thriller', 'War', 'Western'
];

export default function Movies() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [searchingTMDB, setSearchingTMDB] = useState(false);
  const [importingMovie, setImportingMovie] = useState<number | null>(null);
  const { searchMovies } = useTMDB();
  const { toast } = useToast();

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 3) {
        searchTMDB();
      } else {
        setTmdbResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchMovies = async () => {
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('rating', { ascending: false });

      if (error) throw error;
      setMovies(data as Movie[]);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchTMDB = async () => {
    setSearchingTMDB(true);
    try {
      const result = await searchMovies(search);
      if (result && 'movies' in result) {
        // Filter out movies already in database
        const existingTitles = movies.map(m => m.title.toLowerCase());
        const newMovies = result.movies?.filter(
          m => !existingTitles.includes(m.title.toLowerCase())
        ) || [];
        setTmdbResults(newMovies.slice(0, 6));
      }
    } catch (error) {
      console.error('TMDB search error:', error);
    } finally {
      setSearchingTMDB(false);
    }
  };

  const importAndBookMovie = async (tmdbMovie: any) => {
    setImportingMovie(tmdbMovie.tmdb_id);
    try {
      // Insert movie into database
      const movieData = {
        title: tmdbMovie.title,
        description: tmdbMovie.description,
        poster_url: tmdbMovie.poster_url,
        backdrop_url: tmdbMovie.backdrop_url,
        release_date: tmdbMovie.release_date,
        rating: tmdbMovie.rating || 0,
        duration_minutes: tmdbMovie.duration_minutes || 120,
        genre: tmdbMovie.genre || [],
        director: tmdbMovie.director || null,
        cast_members: tmdbMovie.cast_members || [],
        status: 'now_showing',
      };

      const { data: insertedMovie, error: insertError } = await supabase
        .from('movies')
        .insert(movieData)
        .select()
        .single();

      if (insertError) throw insertError;

      // Get a random screen for showtimes
      const { data: screens } = await supabase
        .from('screens')
        .select('id')
        .limit(3);

      if (screens && screens.length > 0) {
        // Create showtimes for next 7 days
        const showtimes = [];
        const times = ['10:00', '14:00', '18:00', '21:00'];
        
        for (let day = 0; day < 7; day++) {
          const date = new Date();
          date.setDate(date.getDate() + day);
          const showDate = date.toISOString().split('T')[0];
          
          for (const screen of screens) {
            for (const time of times) {
              showtimes.push({
                movie_id: insertedMovie.id,
                screen_id: screen.id,
                show_date: showDate,
                show_time: time,
              });
            }
          }
        }

        await supabase.from('showtimes').insert(showtimes);
      }

      toast({
        title: 'Movie imported!',
        description: `${tmdbMovie.title} is now available for booking.`,
      });

      // Navigate to booking page
      navigate(`/movie/${insertedMovie.id}`);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import failed',
        description: 'Could not import movie. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setImportingMovie(null);
    }
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSearch('');
  };

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch = movie.title.toLowerCase().includes(search.toLowerCase()) ||
      movie.genre.some((g) => g.toLowerCase().includes(search.toLowerCase()));
    
    const matchesGenre = selectedGenres.length === 0 ||
      movie.genre.some(g => selectedGenres.some(sg => g.toLowerCase().includes(sg.toLowerCase())));

    return matchesSearch && matchesGenre;
  });

  const nowShowing = filteredMovies.filter((m) => m.status === 'now_showing');
  const comingSoon = filteredMovies.filter((m) => m.status === 'coming_soon');

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold">All Movies</h1>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search movies from TMDB..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
              {searchingTMDB && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Genre Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Filter by Genre</h3>
              {selectedGenres.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" /> Clear
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {GENRE_LIST.map(genre => (
                <Badge
                  key={genre}
                  variant={selectedGenres.includes(genre) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => handleGenreToggle(genre)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {selectedGenres.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Filters:</span>
            {selectedGenres.map(genre => (
              <Badge key={genre} variant="secondary" className="gap-1">
                {genre}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleGenreToggle(genre)}
                />
              </Badge>
            ))}
          </div>
        )}

        {/* TMDB Search Results */}
        {tmdbResults.length > 0 && (
          <div className="mb-8 p-4 bg-card/50 rounded-lg border border-border">
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">
              Results from TMDB - Click to book tickets
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {tmdbResults.map((movie) => (
                <div
                  key={movie.tmdb_id}
                  className="relative group cursor-pointer"
                  onClick={() => importAndBookMovie(movie)}
                >
                  <img
                    src={movie.poster_url || '/placeholder.svg'}
                    alt={movie.title}
                    className="w-full aspect-[2/3] object-cover rounded-lg opacity-70 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent rounded-lg flex flex-col justify-end p-2">
                    <p className="text-xs font-medium text-white line-clamp-2">{movie.title}</p>
                    <p className="text-xs text-white/60">{movie.release_date?.split('-')[0]}</p>
                    <Button
                      size="sm"
                      className="mt-2 h-7 text-xs cinema-gradient"
                      disabled={importingMovie === movie.tmdb_id}
                    >
                      {importingMovie === movie.tmdb_id ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Ticket className="h-3 w-3 mr-1" />
                      )}
                      Book Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="now_showing" className="w-full">
          <TabsList>
            <TabsTrigger value="now_showing">
              Now Showing ({nowShowing.length})
            </TabsTrigger>
            <TabsTrigger value="coming_soon">
              Coming Soon ({comingSoon.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({filteredMovies.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="now_showing" className="mt-6">
            {nowShowing.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">
                No movies found
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {nowShowing.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="coming_soon" className="mt-6">
            {comingSoon.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">
                No upcoming movies found
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {comingSoon.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            {filteredMovies.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">
                No movies found
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {filteredMovies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
