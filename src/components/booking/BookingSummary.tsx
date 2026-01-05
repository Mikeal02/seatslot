import { format, parseISO } from 'date-fns';
import { Calendar, Clock, MapPin, Armchair, Ticket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Movie, Showtime, Seat } from '@/types/database';

interface BookingSummaryProps {
  movie: Movie;
  showtime: Showtime;
  selectedSeats: Seat[];
}

export function BookingSummary({ movie, showtime, selectedSeats }: BookingSummaryProps) {
  const totalAmount = selectedSeats.reduce((sum, seat) => sum + Number(seat.price), 0);
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
    <Card className="bg-card border-border sticky top-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          Booking Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Movie Info */}
        <div className="flex gap-3">
          <img
            src={movie.poster_url || '/placeholder.svg'}
            alt={movie.title}
            className="w-16 h-24 object-cover rounded"
          />
          <div>
            <h3 className="font-semibold">{movie.title}</h3>
            <p className="text-sm text-muted-foreground">
              {movie.duration_minutes} min • {movie.genre.join(', ')}
            </p>
          </div>
        </div>

        <Separator />

        {/* Showtime Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formattedTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>
              {showtime.screen?.theatre?.name} - {showtime.screen?.name}
            </span>
          </div>
        </div>

        {selectedSeats.length > 0 && (
          <>
            <Separator />

            {/* Selected Seats */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Armchair className="h-4 w-4 text-muted-foreground" />
                <span>Selected Seats ({selectedSeats.length})</span>
              </div>
              
              {Object.entries(seatsByType).map(([type, seats]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span className="capitalize text-muted-foreground">
                    {type} ({seats.length}x)
                  </span>
                  <span>
                    {seats.map((s) => `${s.row_label}${s.seat_number}`).join(', ')}
                  </span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Price Breakdown */}
            <div className="space-y-2 text-sm">
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

            <Separator />

            {/* Total */}
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="cinema-gradient-text">₹{totalAmount.toFixed(2)}</span>
            </div>
          </>
        )}

        {selectedSeats.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Select seats to see the price
          </p>
        )}
      </CardContent>
    </Card>
  );
}
