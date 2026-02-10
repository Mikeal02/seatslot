import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="space-y-6 sm:space-y-8">
      {/* Screen */}
      <div className="relative">
        <div className="h-1.5 sm:h-2 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
        <motion.div 
          className="h-8 sm:h-12 bg-gradient-to-b from-primary/10 to-transparent rounded-b-[50%] -mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        />
        <p className="text-center text-[10px] sm:text-sm text-muted-foreground -mt-2 sm:-mt-4 font-medium tracking-widest uppercase">Screen</p>
      </div>

      {/* Seat Legend */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-6 text-[10px] sm:text-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 sm:w-6 sm:h-6 rounded bg-secondary border border-border" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 sm:w-6 sm:h-6 rounded bg-primary shadow-sm shadow-primary/50" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 sm:w-6 sm:h-6 rounded bg-muted/50 opacity-50" />
          <span>Booked</span>
        </div>
      </div>

      {/* Seat Type Legend */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-6 text-[10px] sm:text-sm">
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-[10px] sm:text-xs h-5 sm:h-auto px-1.5 sm:px-2">Regular</Badge>
          <span className="text-muted-foreground">₹150</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="border border-accent/50 text-[10px] sm:text-xs h-5 sm:h-auto px-1.5 sm:px-2">Premium</Badge>
          <span className="text-muted-foreground">₹250</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="border-2 border-accent text-[10px] sm:text-xs h-5 sm:h-auto px-1.5 sm:px-2">VIP</Badge>
          <span className="text-muted-foreground">₹400</span>
        </div>
      </div>

      {/* Seats Grid */}
      <div className="overflow-x-auto pb-4 -mx-1 px-1 scrollbar-thin">
        <div className="flex flex-col items-center gap-0.5 sm:gap-2 min-w-fit">
          {sortedRows.map((row, rowIndex) => (
            <motion.div 
              key={row} 
              className="flex items-center gap-0.5 sm:gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rowIndex * 0.03 }}
            >
              <span className="w-4 sm:w-6 text-[10px] sm:text-sm font-medium text-muted-foreground text-center">{row}</span>
              <div className="flex gap-[2px] sm:gap-1">
                {groupedSeats[row].map((seat) => {
                  const isBooked = bookedSeatIds.includes(seat.id);
                  const isSelected = selectedSeats.some((s) => s.id === seat.id);

                  return (
                    <motion.button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat)}
                      disabled={isBooked}
                      whileTap={!isBooked ? { scale: 0.85 } : undefined}
                      animate={isSelected ? { 
                        scale: [1, 1.15, 1],
                      } : {}}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        'w-5 h-5 sm:w-8 sm:h-8 rounded text-[8px] sm:text-xs font-medium transition-all duration-200',
                        isBooked && 'seat-booked',
                        isSelected && 'seat-selected',
                        !isBooked && !isSelected && 'seat-available',
                        seat.seat_type === 'premium' && 'seat-premium',
                        seat.seat_type === 'vip' && 'seat-vip'
                      )}
                      title={`${row}${seat.seat_number} - ${seat.seat_type} - ₹${seat.price}`}
                    >
                      {seat.seat_number}
                    </motion.button>
                  );
                })}
              </div>
              <span className="w-4 sm:w-6 text-[10px] sm:text-sm font-medium text-muted-foreground text-center">{row}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Selected count indicator */}
      <AnimatePresence>
        {selectedSeats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="text-center"
          >
            <Badge className="cinema-gradient text-primary-foreground px-4 py-1.5 text-sm shadow-lg shadow-primary/20">
              {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected • ₹{selectedSeats.reduce((sum, s) => sum + Number(s.price), 0)}
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}