import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Timer, Film, MapPin, Calendar, Clock, Sparkles, ShieldCheck, ChevronRight, CreditCard } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { Movie, Showtime, Seat } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useBookingTimer } from '@/hooks/useBookingTimer';
import { format, parseISO } from 'date-fns';

// Booking steps
const STEPS = [
  { id: 'seats', label: 'Select Seats', icon: Sparkles, desc: 'Choose your perfect spot' },
  { id: 'extras', label: 'Add Extras', icon: Film, desc: 'Snacks & beverages' },
  { id: 'confirm', label: 'Confirm', icon: ShieldCheck, desc: 'Review & pay' },
] as const;

type StepId = typeof STEPS[number]['id'];

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
  const [currentStep, setCurrentStep] = useState<StepId>('seats');

  const concessionTotal = selectedConcessions.reduce((sum, s) => sum + s.item.price * s.quantity, 0);
  const seatTotal = selectedSeats.reduce((sum, seat) => sum + Number(seat.price), 0);
  const grandTotal = seatTotal + concessionTotal;

  const { timeLeft, formattedTime, isExpired } = useBookingTimer(selectedSeats.length > 0);

  const stepIndex = STEPS.findIndex(s => s.id === currentStep);
  const progressPercent = ((stepIndex + 1) / STEPS.length) * 100;

  useEffect(() => {
    if (isExpired && selectedSeats.length > 0) {
      setSelectedSeats([]);
      setCurrentStep('seats');
      toast({ variant: 'destructive', title: 'Session expired', description: 'Your seat selection has expired. Please select again.' });
    }
  }, [isExpired]);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
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
        .eq('id', showtimeId).single();
      if (showtimeError) throw showtimeError;
      setShowtime(showtimeData as Showtime);
      setMovie(showtimeData.movie as Movie);

      const { data: seatsData, error: seatsError } = await supabase
        .from('seats').select('*').eq('screen_id', showtimeData.screen_id)
        .order('row_label').order('seat_number');
      if (seatsError) throw seatsError;
      setSeats(seatsData as Seat[]);

      const { data: bookedData, error: bookedError } = await supabase
        .from('booked_seats').select('seat_id').eq('showtime_id', showtimeId);
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'booked_seats', filter: `showtime_id=eq.${showtimeId}` },
        (payload) => {
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
      const concessions = selectedConcessions.length > 0 ? {
        total: concessionTotal,
        items: selectedConcessions.map(s => ({ id: s.item.id, name: s.item.name, quantity: s.quantity, price: s.item.price })),
      } : undefined;

      const { data, error } = await supabase.functions.invoke('create-booking-payment', {
        body: {
          showtimeId,
          selectedSeats: selectedSeats.map(s => ({ id: s.id, row_label: s.row_label, seat_number: s.seat_number, seat_type: s.seat_type, price: s.price })),
          totalAmount: grandTotal,
          movieTitle: movie?.title,
          concessions,
          origin: window.location.origin,
        },
      });
      if (error) throw error;
      if (data?.url) { window.location.href = data.url; }
      else throw new Error('Failed to create payment session');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Payment failed', description: error.message || 'Failed to initiate payment.' });
    } finally {
      setBooking(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 'seats' && selectedSeats.length === 0) {
      toast({ variant: 'destructive', title: 'Select seats', description: 'Please select at least one seat.' });
      return;
    }
    const idx = STEPS.findIndex(s => s.id === currentStep);
    if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1].id);
  };

  const handlePrevStep = () => {
    const idx = STEPS.findIndex(s => s.id === currentStep);
    if (idx > 0) setCurrentStep(STEPS[idx - 1].id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-32 w-full rounded-2xl mb-6" />
          <Skeleton className="h-8 w-full max-w-md mx-auto mb-8 rounded-full" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2"><Skeleton className="h-96 w-full rounded-xl" /></div>
            <div><Skeleton className="h-64 w-full rounded-xl" /></div>
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
    <motion.div 
      className="min-h-screen flex flex-col bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Header />

      <main id="main-content" className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 overflow-x-hidden">
        {/* Movie Info Banner */}
        <motion.div 
          className="relative overflow-hidden rounded-2xl mb-6 glow-card"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="absolute inset-0">
            <img src={movie.backdrop_url || movie.poster_url || '/placeholder.svg'} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-card/70" />
          </div>
          <div className="relative flex items-center gap-4 p-4 sm:p-5">
            <img src={movie.poster_url || '/placeholder.svg'} alt={movie.title} className="w-16 h-24 rounded-lg object-cover shadow-lg border border-border/20 hidden sm:block" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                  <Link to={`/movie/${movie.id}`}><ArrowLeft className="h-3 w-3 mr-1" />Back</Link>
                </Button>
                {selectedSeats.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium border ml-auto",
                      timeLeft <= 60 ? "bg-destructive/10 text-destructive border-destructive/30 animate-pulse" : "bg-muted/50 border-border/30"
                    )}
                  >
                    <Timer className="h-3 w-3" />
                    {formattedTime}
                  </motion.div>
                )}
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight line-clamp-1">{movie.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(parseISO(showtime.show_date), 'EEE, MMM d')}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(parseISO(`2000-01-01T${showtime.show_time}`), 'h:mm a')}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{showtime.screen?.theatre?.name} • {showtime.screen?.name}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Step Progress - Enhanced */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 max-w-xl mx-auto">
            {STEPS.map((step, i) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isDone = i < stepIndex;
              return (
                <div key={step.id} className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => {
                      if (isDone || (step.id === 'extras' && selectedSeats.length > 0) || (step.id === 'seats')) {
                        setCurrentStep(step.id);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 text-xs sm:text-sm font-medium transition-all duration-300 group",
                      isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <motion.div 
                      className={cn(
                        "h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300",
                        isActive ? "cinema-gradient border-transparent text-primary-foreground shadow-lg shadow-primary/25" :
                        isDone ? "bg-primary/10 border-primary/40 text-primary" :
                        "bg-muted/50 border-border/50 text-muted-foreground group-hover:border-border"
                      )}
                      animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <StepIcon className="h-4 w-4" />
                    </motion.div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-bold leading-tight">{step.label}</p>
                      <p className="text-[10px] text-muted-foreground font-normal">{step.desc}</p>
                    </div>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 flex items-center justify-center px-1">
                      <div className={cn(
                        "h-[2px] w-full rounded-full transition-colors duration-500",
                        i < stepIndex ? "bg-primary/50" : "bg-border/30"
                      )} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progressPercent} className="h-1 max-w-xl mx-auto rounded-full" />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Mobile Summary */}
          <div className="lg:hidden">
            <BookingSummary movie={movie} showtime={showtime} selectedSeats={selectedSeats} concessionTotal={concessionTotal} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {currentStep === 'seats' && (
                <motion.div 
                  key="seats"
                  className="bg-card rounded-2xl p-3 sm:p-6 border border-border/30 glow-card overflow-hidden"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <SeatSelection seats={seats} bookedSeatIds={bookedSeatIds} selectedSeats={selectedSeats} onSelectionChange={setSelectedSeats} />
                </motion.div>
              )}

              {currentStep === 'extras' && (
                <motion.div 
                  key="extras"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ConcessionSelector selectedItems={selectedConcessions} onItemsChange={setSelectedConcessions} />
                </motion.div>
              )}

              {currentStep === 'confirm' && (
                <motion.div 
                  key="confirm"
                  className="bg-card rounded-2xl p-5 sm:p-8 border border-border/30 glow-card space-y-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center">
                    <div className="h-16 w-16 rounded-2xl cinema-gradient flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
                      <ShieldCheck className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Review & Pay</h2>
                    <p className="text-muted-foreground text-sm mt-1">Please review your booking before payment</p>
                  </div>

                  {/* Order review */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
                      <div className="flex items-center gap-3 mb-3">
                        <img src={movie.poster_url || '/placeholder.svg'} alt="" className="w-12 h-16 rounded-lg object-cover" />
                        <div>
                          <h3 className="font-bold text-sm">{movie.title}</h3>
                          <p className="text-xs text-muted-foreground">{format(parseISO(showtime.show_date), 'EEE, MMM d')} • {format(parseISO(`2000-01-01T${showtime.show_time}`), 'h:mm a')}</p>
                          <p className="text-xs text-muted-foreground">{showtime.screen?.theatre?.name}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSeats.map(s => (
                          <Badge key={s.id} variant="secondary" className="text-[10px] font-semibold">
                            {s.row_label}{s.seat_number} <span className="text-muted-foreground ml-1 capitalize">({s.seat_type})</span>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {selectedConcessions.length > 0 && (
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
                        <h4 className="text-sm font-semibold mb-2">🍿 Add-ons</h4>
                        {selectedConcessions.map(c => (
                          <div key={c.item.id} className="flex justify-between text-xs text-muted-foreground">
                            <span>{c.item.name} × {c.quantity}</span>
                            <span>₹{(c.item.price * c.quantity).toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center p-4 rounded-xl cinema-gradient text-primary-foreground">
                      <span className="font-bold">Total Amount</span>
                      <span className="text-2xl font-black">₹{grandTotal.toFixed(0)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step navigation */}
            <div className="flex items-center justify-between mt-4 gap-3">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 'seats'}
                className="rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back
              </Button>

              {currentStep === 'confirm' ? (
                <Button
                  onClick={handleConfirmBooking}
                  disabled={booking || selectedSeats.length === 0}
                  className="cinema-gradient btn-professional rounded-xl px-8 h-11 font-bold flex-1 max-w-xs"
                  size="lg"
                >
                  {booking ? 'Processing...' : `Pay ₹${grandTotal.toFixed(0)}`}
                </Button>
              ) : (
                <Button
                  onClick={handleNextStep}
                  disabled={currentStep === 'seats' && selectedSeats.length === 0}
                  className="cinema-gradient btn-professional rounded-xl px-8 h-11 font-bold"
                  size="lg"
                >
                  Continue
                </Button>
              )}
            </div>
          </div>

          {/* Desktop Summary */}
          <div className="hidden lg:block lg:sticky lg:top-20 self-start space-y-4">
            <BookingSummary movie={movie} showtime={showtime} selectedSeats={selectedSeats} concessionTotal={concessionTotal} />
          </div>
        </div>

        {/* Mobile fixed bottom */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur-md border-t border-border safe-bottom z-40">
          <div className="flex items-center gap-3">
            {grandTotal > 0 && (
              <div className="text-sm">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                <p className="font-black cinema-gradient-text">₹{grandTotal.toFixed(0)}</p>
              </div>
            )}
            <div className="flex-1">
              {currentStep === 'confirm' ? (
                <Button onClick={handleConfirmBooking} disabled={booking || selectedSeats.length === 0} className="w-full cinema-gradient btn-professional h-11 font-bold rounded-xl" size="lg">
                  {booking ? 'Processing...' : `Pay ₹${grandTotal.toFixed(0)}`}
                </Button>
              ) : (
                <Button onClick={handleNextStep} disabled={currentStep === 'seats' && selectedSeats.length === 0} className="w-full cinema-gradient btn-professional h-11 font-bold rounded-xl" size="lg">
                  Continue
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="lg:hidden h-24" />
      </main>

      <Footer />
    </motion.div>
  );
}
