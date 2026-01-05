import { useEffect, useState } from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Movie, Screen, Showtime } from '@/types/database';

export default function ShowtimesAdmin() {
  const { toast } = useToast();
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [movieId, setMovieId] = useState('');
  const [screenId, setScreenId] = useState('');
  const [showDate, setShowDate] = useState('');
  const [showTime, setShowTime] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [showtimesRes, moviesRes, screensRes] = await Promise.all([
        supabase
          .from('showtimes')
          .select(`
            *,
            movie:movies(*),
            screen:screens(*, theatre:theatres(*))
          `)
          .gte('show_date', new Date().toISOString().split('T')[0])
          .order('show_date')
          .order('show_time'),
        supabase.from('movies').select('*').eq('status', 'now_showing').order('title'),
        supabase.from('screens').select('*, theatre:theatres(*)').order('name'),
      ]);

      if (showtimesRes.error) throw showtimesRes.error;
      if (moviesRes.error) throw moviesRes.error;
      if (screensRes.error) throw screensRes.error;

      setShowtimes(showtimesRes.data as Showtime[]);
      setMovies(moviesRes.data as Movie[]);
      setScreens(screensRes.data as Screen[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMovieId('');
    setScreenId('');
    setShowDate('');
    setShowTime('');
  };

  const handleSave = async () => {
    if (!movieId || !screenId || !showDate || !showTime) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please fill in all fields.',
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.from('showtimes').insert({
        movie_id: movieId,
        screen_id: screenId,
        show_date: showDate,
        show_time: showTime,
      });

      if (error) throw error;

      toast({ title: 'Showtime added successfully' });
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving showtime:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save showtime.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (showtimeId: string) => {
    try {
      const { error } = await supabase.from('showtimes').delete().eq('id', showtimeId);

      if (error) throw error;
      toast({ title: 'Showtime deleted successfully' });
      fetchData();
    } catch (error: any) {
      console.error('Error deleting showtime:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete showtime.',
      });
    }
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
        <h1 className="text-3xl font-bold">Showtimes</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="cinema-gradient">
              <Plus className="h-4 w-4 mr-2" />
              Add Showtime
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Showtime</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Movie *</Label>
                <Select value={movieId} onValueChange={setMovieId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a movie" />
                  </SelectTrigger>
                  <SelectContent>
                    {movies.map((movie) => (
                      <SelectItem key={movie.id} value={movie.id}>
                        {movie.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Screen *</Label>
                <Select value={screenId} onValueChange={setScreenId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a screen" />
                  </SelectTrigger>
                  <SelectContent>
                    {screens.map((screen) => (
                      <SelectItem key={screen.id} value={screen.id}>
                        {screen.theatre?.name} - {screen.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="showDate">Date *</Label>
                  <Input
                    id="showDate"
                    type="date"
                    value={showDate}
                    onChange={(e) => setShowDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="showTime">Time *</Label>
                  <Input
                    id="showTime"
                    type="time"
                    value={showTime}
                    onChange={(e) => setShowTime(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="cinema-gradient">
                {saving ? 'Saving...' : 'Add Showtime'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Movie</TableHead>
              <TableHead>Theatre / Screen</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showtimes.map((showtime) => (
              <TableRow key={showtime.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={showtime.movie?.poster_url || '/placeholder.svg'}
                      alt={showtime.movie?.title}
                      className="w-10 h-14 object-cover rounded"
                    />
                    <span className="font-medium">{showtime.movie?.title}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{showtime.screen?.theatre?.name}</p>
                    <p className="text-sm text-muted-foreground">{showtime.screen?.name}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {format(parseISO(showtime.show_date), 'MMM d, yyyy')}
                  </div>
                </TableCell>
                <TableCell>
                  {format(parseISO(`2000-01-01T${showtime.show_time}`), 'h:mm a')}
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Showtime?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this showtime and all associated bookings.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(showtime.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            {showtimes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No showtimes found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
