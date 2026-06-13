import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Armchair, Ticket, Crown, Star, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Movie, Showtime, Seat } from '@/types/database';
import { cn } from '@/lib/utils';

interface BookingSummaryProps {
  movie: Movie;
  showtime: Showtime;
  selectedSeats: Seat[];
  concessionTotal?: number;
}

const typeIcons: Record<string, React.ElementType> = { vip: Crown, premium: Star, regular: Armchair };
const typeColors: Record<string, string> = {
  vip: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
  premium: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  regular: 'border-primary/20 bg-primary/5',
};

export function BookingSummary({ movie, showtime, selectedSeats, concessionTotal = 0 }: BookingSummaryProps) {
  const seatTotal = selectedSeats.reduce((sum, seat) => sum + Number(seat.price), 0);
  const totalAmount = seatTotal + concessionTotal;
  const formattedTime = format(parseISO(`2000-01-01T${showtime.show_time}`), 'h:mm a');
  const formattedDate = format(parseISO(showtime.show_date), 'EEE, MMM d');

  const seatsByType = selectedSeats.reduce((acc, seat) => {
    if (!acc[seat.seat_type]) acc[seat.seat_type] = [];
    acc[seat.seat_type].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  return (
    <Card className="bg-card border-border/20 glow-card rounded-2xl overflow-hidden max-h-[calc(100vh-8rem)] overflow-y-auto">
      {/* Header */}
      <div className="relative p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl cinema-gradient flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <Ticket className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base">Booking Summary</h3>
            <p className="text-[10px] text-muted-foreground">Review your selection</p>
          </div>
        </div>

        {/* Movie Card */}
        <motion.div 
          className="flex gap-3 p-3 rounded-xl bg-muted/20 border border-border/15 hover:border-border/30 transition-colors"
          whileHover={{ scale: 1.01 }}
        >
          <div className="w-11 sm:w-14 shrink-0">
            <div className="relative w-full" style={{ paddingBottom: '150%' }}>
              <img src={movie.poster_url || '/placeholder.svg'} alt={movie.title} className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-md" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm line-clamp-1">{movie.title}</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5">{movie.duration_minutes}m • {movie.genre?.slice(0, 2).join(', ')}</p>
            {movie.rating && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] font-bold text-amber-400">★ {Number(movie.rating).toFixed(1)}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <CardContent className="space-y-3 px-4 sm:px-5 pb-5  min-w-0 overflow-x-hidden">
        {/* Showtime chips */}
        <div className="grid grid-cols-1 gap-1.5 text-[10px] sm:text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/15 border border-border/10">
            <Calendar className="h-3 w-3 text-primary/50 shrink-0" />
            <span className="font-medium">{formattedDate}</span>
            <span className="text-muted-foreground mx-1">•</span>
            <Clock className="h-3 w-3 text-primary/50 shrink-0" />
            <span className="font-medium">{formattedTime}</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/15 border border-border/10 min-w-0">
  <MapPin className="h-3 w-3 text-primary/50 shrink-0" />
  <span className="font-medium truncate min-w-0 flex-1">{showtime.screen?.theatre?.name} • {showtime.screen?.name}</span>
          </div>
        </div>

        {selectedSeats.length > 0 && (
          <>
            <Separator className="opacity-20" />

            {/* Seat badges by type */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Armchair className="h-3 w-3" />
                Seats ({selectedSeats.length})
              </div>
              {Object.entries(seatsByType).map(([type, typeSeats]) => {
                const Icon = typeIcons[type] || Armchair;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground capitalize">
                      <Icon className="h-2.5 w-2.5" />
                      {type}
                    </div>
                    <div className="flex flex-wrap gap-1 max-w-full">
                      {typeSeats.map(s => (
                        <Badge key={s.id} variant="outline" className={cn("max-w-full text-[10px] font-bold px-2 py-0.5", typeColors[type])}>
                          {s.row_label}{s.seat_number}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator className="opacity-20" />

            {/* Price breakdown */}
            <div className="space-y-2 text-xs">
              {Object.entries(seatsByType).map(([type, typeSeats]) => {
                const typeTotal = typeSeats.reduce((sum, s) => sum + Number(s.price), 0);
                const Icon = typeIcons[type] || Armchair;
                return (
                  <div key={type} className="flex justify-between items-center gap-2 min-w-0">
                    <span className="flex items-center gap-1.5 capitalize text-muted-foreground min-w-0 truncate">
                      <Icon className="h-3 w-3" />
                      {type} × {typeSeats.length}
                    </span>
                    <span className="font-bold">₹{typeTotal.toFixed(0)}</span>
                  </div>
                );
              })}
            </div>

            {concessionTotal > 0 && (
              <>
                <Separator className="opacity-20" />
                <div className="flex justify-between text-xs items-center">
                  <span className="text-muted-foreground flex items-center gap-1.5">🍿 Snacks & Drinks</span>
                  <span className="font-bold">₹{concessionTotal.toFixed(0)}</span>
                </div>
              </>
            )}

            <Separator className="opacity-20" />

            {/* Total */}
            <motion.div 
              className="relative overflow-hidden rounded-xl cinema-gradient text-primary-foreground p-4"
              layout
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
              <div className="relative flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase tracking-wider opacity-80 font-medium">Total</p>
                  <p className="text-2xl font-black tracking-tight">₹{totalAmount.toFixed(0)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
              </div>
            </motion.div>

            <p className="text-[9px] text-center text-muted-foreground">
              🔒 Secure payment powered by Stripe
            </p>
          </>
        )}

        {selectedSeats.length === 0 && (
          <div className="text-center py-8">
            <motion.div 
              className="h-14 w-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-3"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Armchair className="h-6 w-6 text-muted-foreground/30" />
            </motion.div>
            <p className="text-xs text-muted-foreground font-medium">Select seats to see pricing</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">Tap on available seats in the layout</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
