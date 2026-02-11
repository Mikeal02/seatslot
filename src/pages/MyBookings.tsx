import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO, isPast } from 'date-fns';
import { motion } from 'framer-motion';
import { Ticket, Calendar, Clock, MapPin, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Booking } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function MyBookings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchBookings();
    }
  }, [user, authLoading]);

  const fetchBookings = async () => {
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
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data as Booking[]);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load your bookings.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      // Delete booked seats to free them up
      await supabase
        .from('booked_seats')
        .delete()
        .eq('booking_id', bookingId);

      toast({
        title: 'Booking cancelled',
        description: 'Your booking has been cancelled successfully.',
      });

      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to cancel booking.',
      });
    }
  };

  const upcomingBookings = bookings.filter(
    (b) =>
      b.booking_status === 'confirmed' &&
      b.showtime &&
      !isPast(parseISO(`${b.showtime.show_date}T${b.showtime.show_time}`))
  );

  const pastBookings = bookings.filter(
    (b) =>
      b.booking_status === 'confirmed' &&
      b.showtime &&
      isPast(parseISO(`${b.showtime.show_date}T${b.showtime.show_time}`))
  );

  const cancelledBookings = bookings.filter((b) => b.booking_status === 'cancelled');

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const BookingCard = ({ booking, showCancel = false }: { booking: Booking; showCancel?: boolean }) => {
    if (!booking.showtime || !booking.showtime.movie) return null;

    const movie = booking.showtime.movie;
    const screen = booking.showtime.screen!;
    const theatre = screen.theatre!;
    const seats = booking.booked_seats?.map((bs) => bs.seat!) || [];

    return (
      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            <img
              src={movie.poster_url || '/placeholder.svg'}
              alt={movie.title}
              className="w-full sm:w-32 h-48 sm:h-auto object-cover"
            />
            <div className="flex-1 p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{movie.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {movie.genre?.join(', ')}
                  </p>
                </div>
                <Badge
                  variant={booking.booking_status === 'confirmed' ? 'default' : 'destructive'}
                >
                  {booking.booking_status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(parseISO(booking.showtime.show_date), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(parseISO(`2000-01-01T${booking.showtime.show_time}`), 'h:mm a')}
                  </span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{theatre.name} - {screen.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Seats: {seats.map((s) => `${s.row_label}${s.seat_number}`).join(', ')}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="font-bold">₹{Number(booking.total_amount).toFixed(2)}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/booking-confirmation/${booking.id}`}>View Ticket</Link>
                  </Button>
                  {showCancel && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel this booking? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancelBooking(booking.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Yes, Cancel
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <motion.div 
      className="min-h-screen flex flex-col bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="text-center py-16">
            <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No bookings yet</h2>
            <p className="text-muted-foreground mb-6">
              You haven't booked any movie tickets yet.
            </p>
            <Button asChild className="cinema-gradient">
              <Link to="/">Browse Movies</Link>
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastBookings.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled ({cancelledBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4 mt-6">
              {upcomingBookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No upcoming bookings
                </p>
              ) : (
                upcomingBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} showCancel />
                ))
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4 mt-6">
              {pastBookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No past bookings
                </p>
              ) : (
                pastBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4 mt-6">
              {cancelledBookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No cancelled bookings
                </p>
              ) : (
                cancelledBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <Footer />
    </motion.div>
  );
}
