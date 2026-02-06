import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SeatSelection } from '@/components/booking/SeatSelection';
import { BookingSummary } from '@/components/booking/BookingSummary';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Movie, Showtime, Seat } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function Booking() {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [bookedSeatIds, setBookedSeatIds] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (showtimeId) {
      fetchBookingData();
      subscribeToSeatChanges();
    }
  }, [showtimeId, user]);

  const fetchBookingData = async () => {
    try {
      // Fetch showtime with movie and screen info
      const { data: showtimeData, error: showtimeError } = await supabase
        .from('showtimes')
        .select(`
          *,
          movie:movies(*),
          screen:screens(
            *,
            theatre:theatres(*)
          )
        `)
        .eq('id', showtimeId)
        .single();

      if (showtimeError) throw showtimeError;
      setShowtime(showtimeData as Showtime);
      setMovie(showtimeData.movie as Movie);

      // Fetch seats for the screen
      const { data: seatsData, error: seatsError } = await supabase
        .from('seats')
        .select('*')
        .eq('screen_id', showtimeData.screen_id)
        .order('row_label')
        .order('seat_number');

      if (seatsError) throw seatsError;
      setSeats(seatsData as Seat[]);

      // Fetch already booked seats for this showtime
      const { data: bookedData, error: bookedError } = await supabase
        .from('booked_seats')
        .select('seat_id')
        .eq('showtime_id', showtimeId);

      if (bookedError) throw bookedError;
      setBookedSeatIds(bookedData.map((b) => b.seat_id));
    } catch (error) {
      console.error('Error fetching booking data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load booking information.',
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToSeatChanges = () => {
    const channel = supabase
      .channel('booked-seats-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booked_seats',
          filter: `showtime_id=eq.${showtimeId}`,
        },
        (payload) => {
          const newSeatId = payload.new.seat_id;
          setBookedSeatIds((prev) => [...prev, newSeatId]);
          // Remove from selected if someone else booked it
          setSelectedSeats((prev) => prev.filter((s) => s.id !== newSeatId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleConfirmBooking = async () => {
    if (selectedSeats.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No seats selected',
        description: 'Please select at least one seat to proceed.',
      });
      return;
    }

    setBooking(true);

    try {
      const totalAmount = selectedSeats.reduce((sum, seat) => sum + Number(seat.price), 0);

      // Create booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user!.id,
          showtime_id: showtimeId,
          total_amount: totalAmount,
          booking_status: 'confirmed',
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create booked seats
      const bookedSeatsData = selectedSeats.map((seat) => ({
        booking_id: bookingData.id,
        seat_id: seat.id,
        showtime_id: showtimeId!,
      }));

      const { error: seatsError } = await supabase
        .from('booked_seats')
        .insert(bookedSeatsData);

      if (seatsError) {
        // If seats were already booked, rollback the booking
        await supabase.from('bookings').delete().eq('id', bookingData.id);
        throw new Error('Some seats were already booked. Please try again.');
      }

      // Send ticket email
      const screen = showtime?.screen;
      const theatre = screen?.theatre;
      if (user?.email && movie && showtime && screen && theatre) {
        try {
          await supabase.functions.invoke('send-ticket-email', {
            body: {
              email: user.email,
              bookingId: bookingData.id,
              movieTitle: movie.title,
              showDate: showtime.show_date,
              showTime: showtime.show_time,
              theatreName: theatre.name,
              screenName: screen.name,
              seats: selectedSeats.map(s => `${s.row_label}${s.seat_number}`),
              totalAmount,
            },
          });
        } catch (emailError) {
          console.error('Failed to send ticket email:', emailError);
          // Don't fail the booking if email fails
        }
      }

      toast({
        title: 'Booking confirmed!',
        description: 'Your tickets have been booked and sent to your email.',
      });

      navigate(`/booking-confirmation/${bookingData.id}`);
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast({
        variant: 'destructive',
        title: 'Booking failed',
        description: error.message || 'Failed to complete booking. Please try again.',
      });
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
            <div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!showtime || !movie) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Showtime not found</h1>
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

      <main className="flex-1 container mx-auto px-4 py-4 sm:py-8 overflow-x-hidden">
        <Button variant="ghost" size="sm" asChild className="mb-4 sm:mb-6">
          <Link to={`/movie/${movie.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Movie
          </Link>
        </Button>

        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8">Select Your Seats</h1>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Booking Summary - Mobile First */}
          <div className="lg:hidden space-y-4">
            <BookingSummary
              movie={movie}
              showtime={showtime}
              selectedSeats={selectedSeats}
            />
          </div>

          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg p-3 sm:p-6 border border-border overflow-hidden">
              <SeatSelection
                seats={seats}
                bookedSeatIds={bookedSeatIds}
                selectedSeats={selectedSeats}
                onSelectionChange={setSelectedSeats}
              />
            </div>
          </div>

          {/* Booking Summary - Desktop */}
          <div className="hidden lg:block lg:sticky lg:top-20 space-y-4 self-start">
            <BookingSummary
              movie={movie}
              showtime={showtime}
              selectedSeats={selectedSeats}
            />

            <Button
              onClick={handleConfirmBooking}
              disabled={booking || selectedSeats.length === 0}
              className="w-full cinema-gradient"
              size="lg"
            >
              {booking ? 'Confirming...' : selectedSeats.length === 0 ? 'Select Seats to Continue' : `Confirm Booking (${selectedSeats.length} seats)`}
            </Button>
          </div>
        </div>

        {/* Fixed bottom button for mobile */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border safe-bottom">
          <Button
            onClick={handleConfirmBooking}
            disabled={booking || selectedSeats.length === 0}
            className="w-full cinema-gradient"
            size="lg"
          >
            {booking ? 'Confirming...' : selectedSeats.length === 0 ? 'Select Seats' : `Confirm (${selectedSeats.length} seats)`}
          </Button>
        </div>
        {/* Spacer for fixed button on mobile */}
        <div className="lg:hidden h-20" />
      </main>

      <Footer />
    </div>
  );
}
