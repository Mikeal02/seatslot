import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SeatSelection } from '@/components/booking/SeatSelection';
import { BookingSummary } from '@/components/booking/BookingSummary';
import { ConcessionSelector, SelectedConcession } from '@/components/booking/ConcessionSelector';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Movie, Showtime, Seat } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useBookingTimer } from '@/hooks/useBookingTimer';

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
  const [selectedConcessions, setSelectedConcessions] = useState<SelectedConcession[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const concessionTotal = selectedConcessions.reduce((sum, s) => sum + s.item.price * s.quantity, 0);

  const { timeLeft, formattedTime, isExpired } = useBookingTimer(selectedSeats.length > 0);

  useEffect(() => {
    if (isExpired && selectedSeats.length > 0) {
      setSelectedSeats([]);
      toast({
        variant: 'destructive',
        title: 'Session expired',
        description: 'Your seat selection has expired. Please select again.',
      });
    }
  }, [isExpired]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (showtimeId) {
      fetchBookingData();
      const unsubscribe = subscribeToSeatChanges();
      return unsubscribe;
    }
  }, [showtimeId, user]);

  const fetchBookingData = async () => {
    try {
      const { data: showtimeData, error: showtimeError } = await supabase
        .from('showtimes')
        .select(`*, movie:movies(*), screen:screens(*, theatre:theatres(*))`)
        .eq('id', showtimeId)
        .single();

      if (showtimeError) throw showtimeError;
      setShowtime(showtimeData as Showtime);
      setMovie(showtimeData.movie as Movie);

      const { data: seatsData, error: seatsError } = await supabase
        .from('seats')
        .select('*')
        .eq('screen_id', showtimeData.screen_id)
        .order('row_label')
        .order('seat_number');

      if (seatsError) throw seatsError;
      setSeats(seatsData as Seat[]);

      const { data: bookedData, error: bookedError } = await supabase
        .from('booked_seats')
        .select('seat_id')
        .eq('showtime_id', showtimeId);

      if (bookedError) throw bookedError;
      setBookedSeatIds(bookedData.map((b) => b.seat_id));
    } catch (error) {
      console.error('Error fetching booking data:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load booking information.' });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToSeatChanges = () => {
    const channel = supabase
      .channel('booked-seats-changes')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'booked_seats',
        filter: `showtime_id=eq.${showtimeId}`,
      }, (payload) => {
        const newSeatId = payload.new.seat_id;
        setBookedSeatIds((prev) => [...prev, newSeatId]);
        setSelectedSeats((prev) => prev.filter((s) => s.id !== newSeatId));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const handleConfirmBooking = async () => {
    if (selectedSeats.length === 0) {
      toast({ variant: 'destructive', title: 'No seats selected', description: 'Please select at least one seat to proceed.' });
      return;
    }

    setBooking(true);
    try {
      const totalAmount = selectedSeats.reduce((sum, seat) => sum + Number(seat.price), 0) + concessionTotal;

      const concessions = selectedConcessions.length > 0 ? {
        total: concessionTotal,
        items: selectedConcessions.map(s => ({
          id: s.item.id,
          name: s.item.name,
          quantity: s.quantity,
          price: s.item.price,
        })),
      } : undefined;

      const { data, error } = await supabase.functions.invoke('create-booking-payment', {
        body: {
          showtimeId,
          selectedSeats: selectedSeats.map(s => ({
            id: s.id,
            row_label: s.row_label,
            seat_number: s.seat_number,
            seat_type: s.seat_type,
            price: s.price,
          })),
          totalAmount,
          movieTitle: movie?.title,
          concessions,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create payment session');
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast({ variant: 'destructive', title: 'Payment failed', description: error.message || 'Failed to initiate payment. Please try again.' });
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
            <div className="lg:col-span-2"><Skeleton className="h-96 w-full" /></div>
            <div><Skeleton className="h-64 w-full" /></div>
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
            <Button asChild><Link to="/">Go back home</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main id="main-content" className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-8 overflow-x-hidden">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/movie/${movie.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Movie
            </Link>
          </Button>

          {/* Session Timer */}
          {selectedSeats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border",
                timeLeft <= 60
                  ? "bg-destructive/10 text-destructive border-destructive/30 animate-pulse"
                  : "bg-muted border-border"
              )}
            >
              <Timer className="h-3.5 w-3.5" />
              {formattedTime}
            </motion.div>
          )}
        </div>

        <h1 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-8">Select Your Seats</h1>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Booking Summary - Mobile First */}
          <div className="lg:hidden space-y-4">
            <BookingSummary movie={movie} showtime={showtime} selectedSeats={selectedSeats} concessionTotal={concessionTotal} />
          </div>

          <div className="lg:col-span-2">
            <motion.div 
              className="bg-card rounded-lg p-2 sm:p-6 border border-border overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <SeatSelection
                seats={seats}
                bookedSeatIds={bookedSeatIds}
                selectedSeats={selectedSeats}
                onSelectionChange={setSelectedSeats}
              />
            </motion.div>

            {/* Concessions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <ConcessionSelector
                selectedItems={selectedConcessions}
                onItemsChange={setSelectedConcessions}
              />
            </motion.div>
          </div>

          {/* Booking Summary - Desktop */}
          <div className="hidden lg:block lg:sticky lg:top-20 space-y-4 self-start">
            <BookingSummary movie={movie} showtime={showtime} selectedSeats={selectedSeats} concessionTotal={concessionTotal} />
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
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-background/95 backdrop-blur-md border-t border-border safe-bottom z-40">
          <Button
            onClick={handleConfirmBooking}
            disabled={booking || selectedSeats.length === 0}
            className="w-full cinema-gradient"
            size="lg"
          >
            {booking ? 'Confirming...' : selectedSeats.length === 0 ? 'Select Seats' : `Confirm (${selectedSeats.length} seats)`}
          </Button>
        </div>
        <div className="lg:hidden h-20" />
      </main>

      <Footer />
    </div>
  );
}
