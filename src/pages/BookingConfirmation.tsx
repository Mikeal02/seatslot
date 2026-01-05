import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, MapPin, Ticket, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Booking } from '@/types/database';

export default function BookingConfirmation() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          showtime:showtimes(
            *,
            movie:movies(*),
            screen:screens(
              *,
              theatre:theatres(*)
            )
          ),
          booked_seats(
            *,
            seat:seats(*)
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      setBooking(data as Booking);
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-64 mx-auto mb-8" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!booking || !booking.showtime) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Booking not found</h1>
            <Button asChild>
              <Link to="/">Go back home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const movie = booking.showtime.movie!;
  const screen = booking.showtime.screen!;
  const theatre = screen.theatre!;
  const seats = booking.booked_seats?.map((bs) => bs.seat!) || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground">
              Your tickets have been booked successfully
            </p>
          </div>

          {/* Ticket Card */}
          <Card className="bg-card border-border overflow-hidden">
            <div className="cinema-gradient p-4 text-center">
              <Ticket className="h-6 w-6 mx-auto mb-2 text-white" />
              <p className="text-white/80 text-sm">Booking ID</p>
              <p className="text-white font-mono text-lg">
                {booking.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Movie Info */}
              <div className="flex gap-4">
                <img
                  src={movie.poster_url || '/placeholder.svg'}
                  alt={movie.title}
                  className="w-24 h-36 object-cover rounded"
                />
                <div>
                  <h2 className="text-xl font-bold">{movie.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {movie.duration_minutes} min • {movie.genre?.join(', ')}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Showtime Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {format(parseISO(booking.showtime.show_date), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Time</p>
                    <p className="font-medium">
                      {format(parseISO(`2000-01-01T${booking.showtime.show_time}`), 'h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 col-span-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Venue</p>
                    <p className="font-medium">{theatre.name} - {screen.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {theatre.location}, {theatre.city}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Seats */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Seats ({seats.length})</p>
                <div className="flex flex-wrap gap-2">
                  {seats.map((seat) => (
                    <span
                      key={seat.id}
                      className="px-3 py-1 bg-secondary rounded text-sm font-medium"
                    >
                      {seat.row_label}{seat.seat_number}
                    </span>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="text-2xl font-bold cinema-gradient-text">
                  ₹{Number(booking.total_amount).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 mt-8">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/bookings">View All Bookings</Link>
            </Button>
            <Button asChild className="flex-1 cinema-gradient">
              <Link to="/">Book More Tickets</Link>
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Please show this confirmation at the theatre counter to collect your tickets.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
