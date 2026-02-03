import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Seat } from '@/types/database';
import { Badge } from '@/components/ui/badge';

interface SeatSelectionProps {
  seats: Seat[];
  bookedSeatIds: string[];
  selectedSeats: Seat[];
  onSelectionChange: (seats: Seat[]) => void;
}

export function SeatSelection({
  seats,
  bookedSeatIds,
  selectedSeats,
  onSelectionChange,
}: SeatSelectionProps) {
  const [groupedSeats, setGroupedSeats] = useState<Record<string, Seat[]>>({});

  useEffect(() => {
    const grouped = seats.reduce((acc, seat) => {
      if (!acc[seat.row_label]) {
        acc[seat.row_label] = [];
      }
      acc[seat.row_label].push(seat);
      return acc;
    }, {} as Record<string, Seat[]>);

    // Sort seats within each row
    Object.keys(grouped).forEach((row) => {
      grouped[row].sort((a, b) => a.seat_number - b.seat_number);
    });

    setGroupedSeats(grouped);
  }, [seats]);

  const handleSeatClick = (seat: Seat) => {
    if (bookedSeatIds.includes(seat.id)) return;

    const isSelected = selectedSeats.some((s) => s.id === seat.id);
    if (isSelected) {
      onSelectionChange(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      onSelectionChange([...selectedSeats, seat]);
    }
  };

  const sortedRows = Object.keys(groupedSeats).sort();

  return (
    <div className="space-y-8">
      {/* Screen */}
      <div className="relative">
        <div className="h-2 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
        <p className="text-center text-sm text-muted-foreground mt-2">SCREEN</p>
      </div>

      {/* Seat Legend */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-secondary" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-muted/50 opacity-50" />
          <span>Booked</span>
        </div>
      </div>

      {/* Seat Type Legend */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-6 text-xs sm:text-sm">
        <div className="flex items-center gap-1 sm:gap-2">
          <Badge variant="secondary" className="text-xs">Regular</Badge>
          <span className="text-muted-foreground">₹150</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Badge variant="secondary" className="border border-accent/50 text-xs">Premium</Badge>
          <span className="text-muted-foreground">₹250</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Badge variant="secondary" className="border-2 border-accent text-xs">VIP</Badge>
          <span className="text-muted-foreground">₹400</span>
        </div>
      </div>

      {/* Seats Grid */}
      <div className="overflow-x-auto pb-4 -mx-2 px-2">
        <div className="flex flex-col items-center gap-1 sm:gap-2 min-w-fit">
          {sortedRows.map((row) => (
            <div key={row} className="flex items-center gap-1 sm:gap-2">
              <span className="w-4 sm:w-6 text-xs sm:text-sm font-medium text-muted-foreground">{row}</span>
              <div className="flex gap-0.5 sm:gap-1">
                {groupedSeats[row].map((seat) => {
                  const isBooked = bookedSeatIds.includes(seat.id);
                  const isSelected = selectedSeats.some((s) => s.id === seat.id);

                  return (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat)}
                      disabled={isBooked}
                      className={cn(
                        'w-6 h-6 sm:w-8 sm:h-8 rounded text-[10px] sm:text-xs font-medium transition-all duration-200',
                        isBooked && 'seat-booked',
                        isSelected && 'seat-selected',
                        !isBooked && !isSelected && 'seat-available',
                        seat.seat_type === 'premium' && 'seat-premium',
                        seat.seat_type === 'vip' && 'seat-vip'
                      )}
                      title={`${row}${seat.seat_number} - ${seat.seat_type} - ₹${seat.price}`}
                    >
                      {seat.seat_number}
                    </button>
                  );
                })}
              </div>
              <span className="w-4 sm:w-6 text-xs sm:text-sm font-medium text-muted-foreground">{row}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
