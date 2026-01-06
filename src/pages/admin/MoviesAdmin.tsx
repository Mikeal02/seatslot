import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Download, Film } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useTMDB } from '@/hooks/useTMDB';
import { Movie } from '@/types/database';

interface TMDBMovie {
  tmdb_id: number;
  title: string;
  description: string;
  poster_url: string | null;
  backdrop_url: string | null;
  release_date: string;
  rating: number;
  duration_minutes?: number;
  genre?: string[];
  director?: string | null;
  cast_members?: string[];
}

export default function MoviesAdmin() {
  const { toast } = useToast();
  const { fetchNowPlaying, fetchUpcoming, fetchDetails, searchMovies, loading: tmdbLoading, syncMovieFromTMDB } = useTMDB();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tmdbDialogOpen, setTmdbDialogOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [saving, setSaving] = useState(false);
  
  // TMDB state
  const [tmdbMovies, setTmdbMovies] = useState<TMDBMovie[]>([]);
  const [tmdbSearch, setTmdbSearch] = useState('');
  const [tmdbTab, setTmdbTab] = useState('now_playing');
  const [importingId, setImportingId] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [duration, setDuration] = useState('120');
  const [rating, setRating] = useState('0');
  const [genre, setGenre] = useState('');
  const [cast, setCast] = useState('');
  const [director, setDirector] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [status, setStatus] = useState<'now_showing' | 'coming_soon'>('now_showing');

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMovies(data as Movie[]);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPosterUrl('');
    setBackdropUrl('');
    setDuration('120');
    setRating('0');
    setGenre('');
    setCast('');
    setDirector('');
    setReleaseDate('');
    setStatus('now_showing');
    setEditingMovie(null);
  };

  const openEditDialog = (movie: Movie) => {
    setEditingMovie(movie);
    setTitle(movie.title);
    setDescription(movie.description || '');
    setPosterUrl(movie.poster_url || '');
    setBackdropUrl(movie.backdrop_url || '');
    setDuration(movie.duration_minutes.toString());
    setRating((movie.rating || 0).toString());
    setGenre(movie.genre.join(', '));
    setCast(movie.cast_members.join(', '));
    setDirector(movie.director || '');
    setReleaseDate(movie.release_date || '');
    setStatus(movie.status);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Title required',
        description: 'Please enter a movie title.',
      });
      return;
    }

    setSaving(true);

    const movieData = {
      title: title.trim(),
      description: description.trim() || null,
      poster_url: posterUrl.trim() || null,
      backdrop_url: backdropUrl.trim() || null,
      duration_minutes: parseInt(duration) || 120,
      rating: parseFloat(rating) || 0,
      genre: genre.split(',').map((g) => g.trim()).filter(Boolean),
      cast_members: cast.split(',').map((c) => c.trim()).filter(Boolean),
      director: director.trim() || null,
      release_date: releaseDate || null,
      status,
    };

    try {
      if (editingMovie) {
        const { error } = await supabase
          .from('movies')
          .update(movieData)
          .eq('id', editingMovie.id);

        if (error) throw error;
        toast({ title: 'Movie updated successfully' });
      } else {
        const { error } = await supabase.from('movies').insert(movieData);

        if (error) throw error;
        toast({ title: 'Movie added successfully' });
      }

      setDialogOpen(false);
      resetForm();
      fetchMovies();
    } catch (error: any) {
      console.error('Error saving movie:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save movie.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (movieId: string) => {
    try {
      const { error } = await supabase.from('movies').delete().eq('id', movieId);

      if (error) throw error;
      toast({ title: 'Movie deleted successfully' });
      fetchMovies();
    } catch (error: any) {
      console.error('Error deleting movie:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete movie.',
      });
    }
  };

  const filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(search.toLowerCase())
  );

  // TMDB Functions
  const loadTMDBMovies = async (tab: string) => {
    let result;
    if (tab === 'now_playing') {
      result = await fetchNowPlaying();
    } else if (tab === 'upcoming') {
      result = await fetchUpcoming();
    }
    if (result && 'movies' in result) {
      setTmdbMovies(result.movies || []);
    }
  };

  const handleTMDBSearch = async () => {
    if (!tmdbSearch.trim()) return;
    const result = await searchMovies(tmdbSearch);
    if (result && 'movies' in result) {
      setTmdbMovies(result.movies || []);
    }
  };

  const handleImportMovie = async (tmdbMovie: TMDBMovie, status: 'now_showing' | 'coming_soon') => {
    setImportingId(tmdbMovie.tmdb_id);
    try {
      // Get full details first
      const details = await fetchDetails(String(tmdbMovie.tmdb_id));
      const movieToSync = details as TMDBMovie || tmdbMovie;
      
      await syncMovieFromTMDB(movieToSync, status);
      toast({ title: `"${tmdbMovie.title}" imported successfully!` });
      fetchMovies();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Import failed',
        description: error.message || 'Failed to import movie.',
      });
    } finally {
      setImportingId(null);
    }
  };

  const openTMDBDialog = () => {
    setTmdbDialogOpen(true);
    loadTMDBMovies('now_playing');
  };

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Movies</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openTMDBDialog}>
            <Download className="h-4 w-4 mr-2" />
            Import from TMDB
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="cinema-gradient">
                <Plus className="h-4 w-4 mr-2" />
                Add Movie
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMovie ? 'Edit Movie' : 'Add New Movie'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Movie title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="now_showing">Now Showing</SelectItem>
                      <SelectItem value="coming_soon">Coming Soon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Movie description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="posterUrl">Poster URL</Label>
                  <Input
                    id="posterUrl"
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backdropUrl">Backdrop URL</Label>
                  <Input
                    id="backdropUrl"
                    value={backdropUrl}
                    onChange={(e) => setBackdropUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (0-10)</Label>
                  <Input
                    id="rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="releaseDate">Release Date</Label>
                  <Input
                    id="releaseDate"
                    type="date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="genre">Genres (comma separated)</Label>
                <Input
                  id="genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Action, Drama, Sci-Fi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cast">Cast (comma separated)</Label>
                <Input
                  id="cast"
                  value={cast}
                  onChange={(e) => setCast(e.target.value)}
                  placeholder="Actor 1, Actor 2, Actor 3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="director">Director</Label>
                <Input
                  id="director"
                  value={director}
                  onChange={(e) => setDirector(e.target.value)}
                  placeholder="Director name"
                />
              </div>

              <Button onClick={handleSave} disabled={saving} className="cinema-gradient">
                {saving ? 'Saving...' : editingMovie ? 'Update Movie' : 'Add Movie'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* TMDB Import Dialog */}
      <Dialog open={tmdbDialogOpen} onOpenChange={setTmdbDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              Import Movies from TMDB
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search TMDB movies..."
                value={tmdbSearch}
                onChange={(e) => setTmdbSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTMDBSearch()}
              />
              <Button onClick={handleTMDBSearch} disabled={tmdbLoading}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <Tabs value={tmdbTab} onValueChange={(v) => { setTmdbTab(v); loadTMDBMovies(v); }}>
              <TabsList>
                <TabsTrigger value="now_playing">Now Playing</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              </TabsList>
            </Tabs>

            <ScrollArea className="h-[400px]">
              {tmdbLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {tmdbMovies.map((movie) => (
                    <div key={movie.tmdb_id} className="bg-card border rounded-lg overflow-hidden">
                      <img
                        src={movie.poster_url || '/placeholder.svg'}
                        alt={movie.title}
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-3">
                        <h4 className="font-medium text-sm truncate">{movie.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {movie.release_date} • ⭐ {movie.rating}
                        </p>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            disabled={importingId === movie.tmdb_id}
                            onClick={() => handleImportMovie(movie, 'now_showing')}
                          >
                            {importingId === movie.tmdb_id ? '...' : 'Now Showing'}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1 text-xs"
                            disabled={importingId === movie.tmdb_id}
                            onClick={() => handleImportMovie(movie, 'coming_soon')}
                          >
                            {importingId === movie.tmdb_id ? '...' : 'Coming Soon'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!tmdbLoading && tmdbMovies.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No movies found. Try searching or switching tabs.
                </p>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search movies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Movie</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMovies.map((movie) => (
              <TableRow key={movie.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={movie.poster_url || '/placeholder.svg'}
                      alt={movie.title}
                      className="w-12 h-18 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium">{movie.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {movie.genre.slice(0, 2).join(', ')}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={movie.status === 'now_showing' ? 'default' : 'secondary'}>
                    {movie.status === 'now_showing' ? 'Now Showing' : 'Coming Soon'}
                  </Badge>
                </TableCell>
                <TableCell>{movie.duration_minutes} min</TableCell>
                <TableCell>{movie.rating || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(movie)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Movie?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{movie.title}" and all associated showtimes and bookings.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(movie.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredMovies.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No movies found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
