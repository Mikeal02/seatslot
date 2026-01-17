import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, Clock, MapPin, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';

interface RecentBooking {
  id: string;
  movie: {
    id: string;
    title: string;
    poster_url: string | null;
  };
  theatre: string;
  lastBooked: string;
}

export function QuickRebook() {
  const { user } = useAuth();
  const [recentMovies, setRecentMovies] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecentBookings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchRecentBookings = async () => {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          created_at,
          showtime:showtimes(
            movie:movies(id, title, poster_url),
            screen:screens(
              theatre:theatres(name)
            )
          )
        `)
        .eq('user_id', user!.id)
        .eq('booking_status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Group by movie and get unique recent movies
      const movieMap = new Map<string, RecentBooking>();
      
      bookings?.forEach((booking: any) => {
        const movieId = booking.showtime?.movie?.id;
        if (movieId && !movieMap.has(movieId)) {
          movieMap.set(movieId, {
            id: booking.id,
            movie: booking.showtime.movie,
            theatre: booking.showtime?.screen?.theatre?.name || 'Unknown Theatre',
            lastBooked: booking.created_at,
          });
        }
      });

      setRecentMovies(Array.from(movieMap.values()).slice(0, 4));
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    if (loading && user) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      );
    }
    return null;
  }

  if (recentMovies.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold">Quick Rebook</h3>
        </div>
        <Link to="/bookings" className="text-sm text-primary hover:underline flex items-center gap-1">
          View All Bookings <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Watch again? Book tickets for movies you've enjoyed before.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recentMovies.map((item) => (
          <Link key={item.id} to={`/movie/${item.movie.id}`}>
            <Card className="overflow-hidden group hover:border-primary/50 transition-all duration-300 h-full">
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={item.movie.poster_url || '/placeholder.svg'}
                  alt={item.movie.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                <Badge className="absolute bottom-2 left-2 cinema-gradient text-xs">
                  Rebook
                </Badge>
              </div>
              <CardContent className="p-3 space-y-2">
                <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                  {item.movie.title}
                </h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="line-clamp-1">{item.theatre}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{format(parseISO(item.lastBooked), 'MMM d')}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
