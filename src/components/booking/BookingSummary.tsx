import { format, parseISO } from 'date-fns';
import { Calendar, Clock, MapPin, Armchair, Ticket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const formattedDate = format(parseISO(showtime.show_date), 'EEEE, MMMM d, yyyy');

  const seatsByType = selectedSeats.reduce((acc, seat) => {
    if (!acc[seat.seat_type]) {
      acc[seat.seat_type] = [];
    }
    acc[seat.seat_type].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  return (
    <Card className="bg-card border-border max-h-[calc(100vh-8rem)] overflow-y-auto glow-card">
      <CardHeader className="px-4 sm:px-6 py-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Ticket className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Booking Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 sm:px-6">
        {/* Movie Info */}
        <div className="flex gap-3">
          <div className="w-12 sm:w-16 shrink-0">
            <div className="relative w-full" style={{ paddingBottom: '150%' }}>
              <img
                src={movie.poster_url || '/placeholder.svg'}
                alt={movie.title}
                className="absolute inset-0 w-full h-full object-cover rounded"
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm sm:text-base line-clamp-2">{movie.title}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {movie.duration_minutes} min • {movie.genre.slice(0, 2).join(', ')}
            </p>
          </div>
        </div>

        <Separator />

        {/* Showtime Info */}
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            <span>{formattedTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            <span className="truncate">
              {showtime.screen?.theatre?.name} - {showtime.screen?.name}
            </span>
          </div>
        </div>

        {selectedSeats.length > 0 && (
          <>
            <Separator />

            {/* Selected Seats */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                <Armchair className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <span>Selected Seats ({selectedSeats.length})</span>
              </div>
              
              {Object.entries(seatsByType).map(([type, seats]) => (
                <div key={type} className="flex justify-between text-xs sm:text-sm gap-2">
                  <span className="capitalize text-muted-foreground shrink-0">
                    {type} ({seats.length}x)
                  </span>
                  <span className="truncate text-right">
                    {seats.map((s) => `${s.row_label}${s.seat_number}`).join(', ')}
                  </span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Price Breakdown */}
            <div className="space-y-2 text-xs sm:text-sm">
              {Object.entries(seatsByType).map(([type, seats]) => {
                const typeTotal = seats.reduce((sum, s) => sum + Number(s.price), 0);
                return (
                  <div key={type} className="flex justify-between">
                    <span className="capitalize text-muted-foreground">
                      {type} × {seats.length}
                    </span>
                    <span>₹{typeTotal.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            {concessionTotal > 0 && (
              <>
                <Separator />
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">🍿 Snacks & Drinks</span>
                  <span>₹{concessionTotal.toFixed(2)}</span>
                </div>
              </>
            )}

            <Separator />

            {/* Total */}
            <div className="flex justify-between font-bold text-base sm:text-lg">
              <span>Total</span>
              <span className="cinema-gradient-text">₹{totalAmount.toFixed(2)}</span>
            </div>
          </>
        )}

        {selectedSeats.length === 0 && (
          <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
            Select seats to see the price
          </p>
        )}
      </CardContent>
    </Card>
  );
}
