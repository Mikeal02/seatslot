import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO, isPast } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Calendar, Clock, MapPin, X, Film, ChevronRight, Sparkles, TicketCheck, Ban, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Booking } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type TabKey = 'upcoming' | 'past' | 'cancelled';

export default function MyBookings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');

  useEffect(() => {
    if (!authLoading && !user) { navigate('/auth'); return; }
    if (user) fetchBookings();
  }, [user, authLoading]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`*, showtime:showtimes(*, movie:movies(*), screen:screens(*, theatre:theatres(*))), booked_seats(*, seat:seats(*))`)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBookings(data as Booking[]);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load your bookings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase.from('bookings').update({ booking_status: 'cancelled' }).eq('id', bookingId);
      if (error) throw error;
      await supabase.from('booked_seats').delete().eq('booking_id', bookingId);
      toast({ title: 'Booking cancelled', description: 'Your booking has been cancelled successfully.' });
      fetchBookings();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to cancel booking.' });
    }
  };

  const upcomingBookings = bookings.filter(
    (b) => b.booking_status === 'confirmed' && b.showtime && !isPast(parseISO(`${b.showtime.show_date}T${b.showtime.show_time}`))
  );
  const pastBookings = bookings.filter(
    (b) => b.booking_status === 'confirmed' && b.showtime && isPast(parseISO(`${b.showtime.show_date}T${b.showtime.show_time}`))
  );
  const cancelledBookings = bookings.filter((b) => b.booking_status === 'cancelled');

  const tabs: { key: TabKey; label: string; icon: typeof Ticket; count: number }[] = [
    { key: 'upcoming', label: 'Upcoming', icon: TicketCheck, count: upcomingBookings.length },
    { key: 'past', label: 'Past', icon: History, count: pastBookings.length },
    { key: 'cancelled', label: 'Cancelled', icon: Ban, count: cancelledBookings.length },
  ];

  const currentBookings = activeTab === 'upcoming' ? upcomingBookings : activeTab === 'past' ? pastBookings : cancelledBookings;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-5 w-72 mb-8" />
            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-11 w-32 rounded-xl" />)}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)}
            </div>
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
    >
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-10">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <motion.div
            className="mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-1">My Bookings</h1>
            <p className="text-muted-foreground text-sm">
              {bookings.length > 0 ? `${bookings.length} total booking${bookings.length !== 1 ? 's' : ''}` : 'Your booking history'}
            </p>
          </motion.div>

          {bookings.length === 0 ? (
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <Card className="border-border/30 rounded-3xl glow-card">
                <CardContent className="py-20 text-center">
                  <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <Film className="h-12 w-12 text-primary/40" />
                  </div>
                  <h2 className="text-2xl font-black mb-2">No bookings yet</h2>
                  <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">
                    Start your cinematic journey — browse movies and book your first ticket for an unforgettable experience!
                  </p>
                  <Button asChild className="cinema-gradient btn-professional rounded-full px-8 h-12 text-base font-bold">
                    <Link to="/movies">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Browse Movies
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <>
              {/* Custom Tab Bar */}
              <motion.div
                className="flex gap-2 mb-6 overflow-x-auto pb-1"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shrink-0 ${
                      activeTab === tab.key
                        ? 'text-primary-foreground'
                        : 'bg-muted/40 text-muted-foreground hover:bg-muted/60 border border-border/30'
                    }`}
                  >
                    {activeTab === tab.key && (
                      <motion.div
                        layoutId="activeBookingTab"
                        className="absolute inset-0 cinema-gradient rounded-xl shadow-lg"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 h-5 ${
                          activeTab === tab.key ? 'bg-white/20 text-white border-0' : ''
                        }`}
                      >
                        {tab.count}
                      </Badge>
                    </span>
                  </button>
                ))}
              </motion.div>

              {/* Booking Cards */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  {currentBookings.length === 0 ? (
                    <Card className="border-border/30 rounded-2xl">
                      <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No {activeTab} bookings</p>
                      </CardContent>
                    </Card>
                  ) : (
                    currentBookings.map((booking, i) => {
                      const movie = booking.showtime?.movie;
                      const screen = booking.showtime?.screen;
                      const theatre = screen?.theatre;
                      const seats = booking.booked_seats?.map((bs) => bs.seat!) || [];

                      if (!movie || !booking.showtime) return null;

                      return (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                        >
                          <Card className="group border-border/30 rounded-2xl overflow-hidden hover:border-primary/20 transition-all duration-300 glow-card">
                            <CardContent className="p-0">
                              <div className="flex flex-col sm:flex-row">
                                {/* Poster */}
                                <div className="relative sm:w-36 h-40 sm:h-auto overflow-hidden shrink-0">
                                  <img
                                    src={movie.poster_url || '/placeholder.svg'}
                                    alt={movie.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card sm:block hidden" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent sm:hidden" />

                                  {/* Status badge on poster */}
                                  <div className="absolute top-3 left-3">
                                    <Badge
                                      className={`text-[10px] font-bold uppercase tracking-wider border-0 ${
                                        booking.booking_status === 'confirmed'
                                          ? 'cinema-gradient text-primary-foreground'
                                          : 'bg-destructive text-destructive-foreground'
                                      }`}
                                    >
                                      {booking.booking_status === 'confirmed' ? '✓ Confirmed' : 'Cancelled'}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Details */}
                                <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between min-w-0">
                                  <div>
                                    <h3 className="font-black text-lg sm:text-xl tracking-tight mb-1 group-hover:text-primary transition-colors">
                                      {movie.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mb-4">
                                      {movie.duration_minutes} min • {movie.genre?.join(', ')}
                                    </p>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                      {[
                                        { icon: Calendar, value: format(parseISO(booking.showtime.show_date), 'MMM d, yyyy') },
                                        { icon: Clock, value: format(parseISO(`2000-01-01T${booking.showtime.show_time}`), 'h:mm a') },
                                        { icon: MapPin, value: `${theatre?.name || 'N/A'} • ${screen?.name || ''}` },
                                        { icon: Ticket, value: seats.map((s) => `${s.row_label}${s.seat_number}`).join(', ') || 'N/A' },
                                      ].map((item, j) => (
                                        <div key={j} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                          <item.icon className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                                          <span className="truncate">{item.value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Footer */}
                                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/20">
                                    <div>
                                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total</p>
                                      <p className="text-xl font-black tracking-tight cinema-gradient-text">₹{Number(booking.total_amount).toFixed(0)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {activeTab === 'upcoming' && (
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10 h-9">
                                              <X className="h-3.5 w-3.5 mr-1" />
                                              Cancel
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent className="rounded-2xl">
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                This action cannot be undone. Your seats will be released.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel className="rounded-xl">Keep</AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() => handleCancelBooking(booking.id)}
                                                className="bg-destructive text-destructive-foreground rounded-xl"
                                              >
                                                Yes, Cancel
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      )}
                                      <Button asChild size="sm" className="cinema-gradient btn-professional rounded-xl h-9 gap-1.5">
                                        <Link to={`/booking-confirmation/${booking.id}`}>
                                          View Ticket
                                          <ChevronRight className="h-3.5 w-3.5" />
                                        </Link>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>
      </main>

      <Footer />
    </motion.div>
  );
}
