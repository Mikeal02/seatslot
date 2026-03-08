import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, Clock, MapPin, Ticket, Share2, Star, Download, Film, Sparkles } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Booking } from '@/types/database';

export default function BookingConfirmation() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (bookingId) fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`*, showtime:showtimes(*, movie:movies(*), screen:screens(*, theatre:theatres(*))), booked_seats(*, seat:seats(*))`)
        .eq('id', bookingId).single();
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
          <div className="max-w-2xl mx-auto space-y-6">
            <Skeleton className="h-20 w-20 rounded-full mx-auto" />
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-[500px] w-full rounded-2xl" />
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
            <Button asChild><Link to="/">Go back home</Link></Button>
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Movie Ticket - ${movie.title}`,
          text: `I'm watching ${movie.title} on ${format(parseISO(booking.showtime!.show_date), 'MMM d')} at ${theatre.name}!`,
          url: window.location.href,
        });
      } catch {}
    }
  };

  return (
    <motion.div 
      className="min-h-screen flex flex-col bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-10">
        <div className="max-w-2xl mx-auto">
          {/* Celebration Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            {/* Animated success icon */}
            <motion.div 
              className="relative inline-flex items-center justify-center w-24 h-24 mb-5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            >
              <div className="absolute inset-0 rounded-full cinema-gradient opacity-20 animate-ping" />
              <div className="absolute inset-2 rounded-full cinema-gradient opacity-10" />
              <div className="relative w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500/30">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
            </motion.div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground">Your cinematic experience awaits ✨</p>
          </motion.div>

          {/* Premium Ticket Card */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="overflow-hidden glow-card border-border/30 rounded-3xl">
              {/* Ticket Header with movie backdrop */}
              <div className="relative h-40 sm:h-48 overflow-hidden">
                <img src={movie.backdrop_url || movie.poster_url || '/placeholder.svg'} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-card/70 to-transparent" />
                
                {/* Movie info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <div className="flex items-end gap-4">
                    <img src={movie.poster_url || '/placeholder.svg'} alt={movie.title} className="w-16 h-24 rounded-xl shadow-2xl object-cover border border-border/20 hidden sm:block" />
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight">{movie.title}</h2>
                      <p className="text-sm text-muted-foreground">{movie.duration_minutes} min • {movie.genre?.join(', ')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket tear line */}
              <div className="relative flex items-center px-4">
                <div className="w-6 h-6 rounded-full bg-background -ml-7 shrink-0" />
                <div className="flex-1 border-t-2 border-dashed border-border/50 mx-2" />
                <div className="w-6 h-6 rounded-full bg-background -mr-7 shrink-0" />
              </div>

              <CardContent className="p-5 sm:p-8 space-y-6">
                {/* QR and Booking ID */}
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <motion.div 
                    className="relative cursor-pointer"
                    onClick={() => setIsFlipped(!isFlipped)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ perspective: 600 }}
                  >
                    <motion.div
                      className="bg-white p-4 rounded-2xl shadow-xl border border-border/10"
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.6 }}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {!isFlipped ? (
                        <QRCodeSVG
                          value={`CINEBOOK-TICKET:${booking.id}|${movie.title}|${booking.showtime.show_date}|${booking.showtime.show_time}|${seats.map(s => `${s.row_label}${s.seat_number}`).join(',')}`}
                          size={140}
                          level="H"
                          includeMargin={false}
                        />
                      ) : (
                        <div className="w-[140px] h-[140px] flex items-center justify-center" style={{ transform: 'rotateY(180deg)' }}>
                          <div className="text-center">
                            <Film className="h-8 w-8 mx-auto mb-2 text-primary" />
                            <p className="text-xs font-bold text-gray-800">Tap to flip back</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>

                  <div className="text-center sm:text-left">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">Booking ID</p>
                    <p className="font-mono text-lg font-black tracking-wider cinema-gradient-text">
                      {booking.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-2">Tap QR code to flip • Show at entry</p>
                  </div>
                </div>

                <Separator className="opacity-50" />

                {/* Showtime Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Calendar, label: 'Date', value: format(parseISO(booking.showtime.show_date), 'EEEE, MMM d, yyyy') },
                    { icon: Clock, label: 'Time', value: format(parseISO(`2000-01-01T${booking.showtime.show_time}`), 'h:mm a') },
                    { icon: MapPin, label: 'Venue', value: `${theatre.name}`, sub: `${screen.name} • ${theatre.location}` },
                    { icon: Star, label: 'Rating', value: movie.rating ? `${movie.rating}/10` : 'N/A' },
                  ].map((item, i) => (
                    <motion.div 
                      key={item.label} 
                      className="p-3 rounded-xl bg-muted/30 border border-border/20"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.08 }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <item.icon className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{item.label}</span>
                      </div>
                      <p className="font-semibold text-sm leading-tight">{item.value}</p>
                      {item.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{item.sub}</p>}
                    </motion.div>
                  ))}
                </div>

                <Separator className="opacity-50" />

                {/* Seats */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Your Seats ({seats.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {seats.map((seat, i) => (
                      <motion.div
                        key={seat.id}
                        className="relative"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 + i * 0.05 }}
                      >
                        <Badge 
                          variant="secondary" 
                          className={`px-3 py-1.5 text-sm font-bold rounded-xl ${
                            seat.seat_type === 'vip' ? 'border-2 border-accent shadow-sm shadow-accent/20' :
                            seat.seat_type === 'premium' ? 'border border-accent/50' : ''
                          }`}
                        >
                          {seat.row_label}{seat.seat_number}
                          <span className="text-[10px] text-muted-foreground ml-1 capitalize font-medium">({seat.seat_type})</span>
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <Separator className="opacity-50" />

                {/* Total */}
                <div className="flex justify-between items-center p-4 rounded-2xl cinema-gradient text-primary-foreground">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-80 font-medium">Total Paid</p>
                    <p className="text-3xl font-black tracking-tight">₹{Number(booking.total_amount).toFixed(0)}</p>
                  </div>
                  <div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div 
            className="flex gap-3 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Button variant="outline" size="sm" onClick={handleShare} className="rounded-xl shrink-0">
              <Share2 className="h-4 w-4 mr-1.5" />
              Share
            </Button>
            <Button asChild variant="outline" className="flex-1 rounded-xl">
              <Link to="/bookings">All Bookings</Link>
            </Button>
            <Button asChild className="flex-1 cinema-gradient btn-professional rounded-xl">
              <Link to="/">Book More</Link>
            </Button>
          </motion.div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Show this ticket at the theatre counter for entry. Enjoy the show! 🎬
          </p>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
}
