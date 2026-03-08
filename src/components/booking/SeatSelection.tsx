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

export function SeatSelection({ seats, bookedSeatIds, selectedSeats, onSelectionChange }: SeatSelectionProps) {
  const [groupedSeats, setGroupedSeats] = useState<Record<string, Seat[]>>({});

  useEffect(() => {
    const grouped = seats.reduce((acc, seat) => {
      if (!acc[seat.row_label]) acc[seat.row_label] = [];
      acc[seat.row_label].push(seat);
      return acc;
    }, {} as Record<string, Seat[]>);
    Object.keys(grouped).forEach((row) => grouped[row].sort((a, b) => a.seat_number - b.seat_number));
    setGroupedSeats(grouped);
  }, [seats]);

  const handleSeatClick = (seat: Seat) => {
    if (bookedSeatIds.includes(seat.id)) return;
    const isSelected = selectedSeats.some((s) => s.id === seat.id);
    onSelectionChange(isSelected ? selectedSeats.filter((s) => s.id !== seat.id) : [...selectedSeats, seat]);
  };

  const sortedRows = Object.keys(groupedSeats).sort();
  const totalSeats = seats.length;
  const bookedCount = bookedSeatIds.length;
  const availableCount = totalSeats - bookedCount;
  const occupancyPercent = totalSeats > 0 ? Math.round((bookedCount / totalSeats) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Cinematic Screen with glow */}
      <div className="relative">
        <div className="absolute inset-x-4 top-0 h-16 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.12)_0%,transparent_70%)] pointer-events-none" />
        <div className="h-2 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full mx-4 shadow-lg shadow-primary/30" />
        <motion.div 
          className="h-10 sm:h-14 bg-gradient-to-b from-primary/15 to-transparent rounded-b-[60%] -mt-1 mx-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        />
        <p className="text-center text-[10px] sm:text-xs text-muted-foreground -mt-3 sm:-mt-5 font-semibold tracking-[0.2em] uppercase">Screen</p>
      </div>

      {/* Legend + Availability */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap justify-center gap-3 sm:gap-5 text-[10px] sm:text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-secondary border border-border" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-primary shadow-sm shadow-primary/50" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-muted/50 opacity-50" />
            <span>Taken</span>
          </div>
        </div>
        
        {/* Occupancy indicator */}
        <div className="flex items-center gap-2 text-[10px] sm:text-xs">
          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full transition-all", occupancyPercent > 80 ? "bg-destructive" : occupancyPercent > 50 ? "bg-accent" : "bg-primary")}
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
          <span className="text-muted-foreground font-medium">{availableCount} available</span>
        </div>
      </div>

      {/* Seat Type Prices */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-[10px] sm:text-xs">
        {[
          { type: 'Regular', price: '₹150', style: '' },
          { type: 'Premium', price: '₹250', style: 'border border-accent/50' },
          { type: 'VIP', price: '₹400', style: 'border-2 border-accent' },
        ].map(t => (
          <div key={t.type} className="flex items-center gap-1.5">
            <Badge variant="secondary" className={cn("text-[10px] sm:text-xs h-5 sm:h-auto px-1.5 sm:px-2 font-medium", t.style)}>{t.type}</Badge>
            <span className="text-muted-foreground font-medium">{t.price}</span>
          </div>
        ))}
      </div>

      {/* Seats Grid */}
      <div className="overflow-x-auto pb-4 -mx-1 px-1 scrollbar-thin">
        <div className="flex flex-col items-center gap-0.5 sm:gap-1.5 min-w-fit">
          {sortedRows.map((row, rowIndex) => {
            const rowSeats = groupedSeats[row];
            const midpoint = Math.ceil(rowSeats.length / 2);
            
            return (
              <motion.div 
                key={row} 
                className="flex items-center gap-0.5 sm:gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rowIndex * 0.02 }}
              >
                <span className="w-5 sm:w-7 text-[10px] sm:text-xs font-bold text-muted-foreground text-right">{row}</span>
                <div className="flex gap-[2px] sm:gap-1">
                  {rowSeats.map((seat, seatIdx) => {
                    const isBooked = bookedSeatIds.includes(seat.id);
                    const isSelected = selectedSeats.some((s) => s.id === seat.id);
                    const isAisle = seatIdx === midpoint - 1;

                    return (
                      <div key={seat.id} className={cn("flex", isAisle && "mr-2 sm:mr-4")}>
                        <motion.button
                          onClick={() => handleSeatClick(seat)}
                          disabled={isBooked}
                          whileTap={!isBooked ? { scale: 0.8 } : undefined}
                          whileHover={!isBooked ? { scale: 1.15, y: -2 } : undefined}
                          animate={isSelected ? { scale: [1, 1.15, 1] } : {}}
                          transition={{ duration: 0.3 }}
                          className={cn(
                            'w-5 h-5 sm:w-8 sm:h-8 rounded-md text-[8px] sm:text-[10px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                            isBooked && 'bg-muted/30 cursor-not-allowed opacity-30',
                            isSelected && 'seat-selected shadow-lg',
                            !isBooked && !isSelected && 'seat-available hover:bg-primary/20',
                            seat.seat_type === 'premium' && !isBooked && 'seat-premium',
                            seat.seat_type === 'vip' && !isBooked && 'seat-vip'
                          )}
                          aria-label={`${row}${seat.seat_number}, ${seat.seat_type}, ₹${seat.price}${isBooked ? ', taken' : isSelected ? ', selected' : ''}`}
                          aria-pressed={isSelected}
                          title={`${row}${seat.seat_number} • ${seat.seat_type} • ₹${seat.price}`}
                        >
                          {seat.seat_number}
                        </motion.button>
                      </div>
                    );
                  })}
                </div>
                <span className="w-5 sm:w-7 text-[10px] sm:text-xs font-bold text-muted-foreground">{row}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selection Summary */}
      <AnimatePresence>
        {selectedSeats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            className="text-center space-y-2"
          >
            <div className="flex flex-wrap justify-center gap-1.5">
              {selectedSeats.map(s => (
                <Badge key={s.id} variant="outline" className="text-xs font-bold border-primary/30 bg-primary/5">
                  {s.row_label}{s.seat_number}
                </Badge>
              ))}
            </div>
            <Badge className="cinema-gradient text-primary-foreground px-5 py-2 text-sm shadow-lg shadow-primary/20 font-bold rounded-full">
              {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} • ₹{selectedSeats.reduce((sum, s) => sum + Number(s.price), 0)}
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
