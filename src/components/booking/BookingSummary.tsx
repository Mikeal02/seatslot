import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Armchair, Ticket, Film } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Movie, Showtime, Seat } from '@/types/database';

interface BookingSummaryProps {
  movie: Movie;
  showtime: Showtime;
  selectedSeats: Seat[];
  concessionTotal?: number;
}

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
    <Card className="bg-card border-border/30 glow-card rounded-2xl overflow-hidden max-h-[calc(100vh-8rem)] overflow-y-auto">
      {/* Header with movie mini poster */}
      <div className="relative p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-xl cinema-gradient flex items-center justify-center shrink-0">
            <Ticket className="h-4 w-4 text-primary-foreground" />
          </div>
          <h3 className="font-bold text-base">Booking Summary</h3>
        </div>

        {/* Movie */}
        <div className="flex gap-3 p-3 rounded-xl bg-muted/30 border border-border/20">
          <div className="w-10 sm:w-12 shrink-0">
            <div className="relative w-full" style={{ paddingBottom: '150%' }}>
              <img src={movie.poster_url || '/placeholder.svg'} alt={movie.title} className="absolute inset-0 w-full h-full object-cover rounded-lg" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm line-clamp-1">{movie.title}</h4>
            <p className="text-[10px] text-muted-foreground">{movie.duration_minutes}m • {movie.genre.slice(0, 2).join(', ')}</p>
          </div>
        </div>
      </div>

      <CardContent className="space-y-3 px-4 sm:px-5 pb-5">
        {/* Showtime chips */}
        <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs">
          <div className="flex items-center gap-1.5 bg-muted/30 rounded-full px-2.5 py-1 border border-border/20">
            <Calendar className="h-3 w-3 text-primary/60" />
            <span className="font-medium">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-muted/30 rounded-full px-2.5 py-1 border border-border/20">
            <Clock className="h-3 w-3 text-primary/60" />
            <span className="font-medium">{formattedTime}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-muted/30 rounded-full px-2.5 py-1 border border-border/20">
            <MapPin className="h-3 w-3 text-primary/60" />
            <span className="font-medium truncate max-w-[120px]">{showtime.screen?.theatre?.name}</span>
          </div>
        </div>

        {selectedSeats.length > 0 && (
          <>
            <Separator className="opacity-30" />

            {/* Seat badges */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Armchair className="h-3 w-3" />
                Seats ({selectedSeats.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedSeats.map(s => (
                  <Badge key={s.id} variant="outline" className="text-[10px] font-bold border-primary/20 bg-primary/5 px-2 py-0.5">
                    {s.row_label}{s.seat_number}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator className="opacity-30" />

            {/* Price breakdown */}
            <div className="space-y-1.5 text-xs">
              {Object.entries(seatsByType).map(([type, typeSeats]) => {
                const typeTotal = typeSeats.reduce((sum, s) => sum + Number(s.price), 0);
                return (
                  <div key={type} className="flex justify-between">
                    <span className="capitalize text-muted-foreground">{type} × {typeSeats.length}</span>
                    <span className="font-semibold">₹{typeTotal.toFixed(0)}</span>
                  </div>
                );
              })}
            </div>

            {concessionTotal > 0 && (
              <>
                <Separator className="opacity-30" />
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">🍿 Snacks & Drinks</span>
                  <span className="font-semibold">₹{concessionTotal.toFixed(0)}</span>
                </div>
              </>
            )}

            <Separator className="opacity-30" />

            {/* Total */}
            <motion.div 
              className="flex justify-between items-center p-3 rounded-xl cinema-gradient text-primary-foreground"
              layout
            >
              <span className="font-bold text-sm">Total</span>
              <span className="text-xl font-black tracking-tight">₹{totalAmount.toFixed(0)}</span>
            </motion.div>
          </>
        )}

        {selectedSeats.length === 0 && (
          <div className="text-center py-6">
            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-2">
              <Armchair className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="text-xs text-muted-foreground">Select seats to see pricing</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
