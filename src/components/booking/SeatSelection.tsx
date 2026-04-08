import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Seat } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Armchair, Crown, Star, Zap } from 'lucide-react';

interface SeatSelectionProps {
  seats: Seat[];
  bookedSeatIds: string[];
  selectedSeats: Seat[];
  onSelectionChange: (seats: Seat[]) => void;
}

const seatTypeConfig = {
  regular: { icon: Armchair, label: 'Regular', color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
  premium: { icon: Star, label: 'Premium', color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/40', glow: 'shadow-amber-500/25' },
  vip: { icon: Crown, label: 'VIP', color: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/50', glow: 'shadow-purple-500/30' },
};

export function SeatSelection({ seats, bookedSeatIds, selectedSeats, onSelectionChange }: SeatSelectionProps) {
  const [groupedSeats, setGroupedSeats] = useState<Record<string, Seat[]>>({});
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

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

  // Group selected seats by type for summary
  const selectedByType = selectedSeats.reduce((acc, s) => {
    if (!acc[s.seat_type]) acc[s.seat_type] = [];
    acc[s.seat_type].push(s);
    return acc;
  }, {} as Record<string, Seat[]>);

  return (
    <div className="space-y-5">
      {/* Cinematic Screen with premium glow */}
      <div className="relative pt-2">
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.15)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative mx-6 sm:mx-12">
          <div className="h-1.5 bg-gradient-to-r from-transparent via-primary/80 to-transparent rounded-full shadow-[0_0_20px_hsl(var(--primary)/0.4)]" />
          <motion.div 
            className="h-8 sm:h-12 bg-gradient-to-b from-primary/12 to-transparent rounded-b-[50%]"
            initial={{ opacity: 0, scaleX: 0.8 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          />
        </div>
        <motion.p 
          className="text-center text-[9px] sm:text-[10px] text-muted-foreground -mt-2 sm:-mt-4 font-bold tracking-[0.3em] uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Screen This Way
        </motion.p>
      </div>

      {/* Legend + Stats Bar */}
      <motion.div 
        className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-muted/20 border border-border/20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex flex-wrap justify-center gap-4 text-[10px] sm:text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-secondary/80 border border-border/50 flex items-center justify-center">
              <Armchair className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-primary shadow-md shadow-primary/40 flex items-center justify-center">
              <Zap className="h-2.5 w-2.5 text-primary-foreground" />
            </div>
            <span className="text-muted-foreground">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-muted/30 opacity-40" />
            <span className="text-muted-foreground">Taken</span>
          </div>
        </div>
        
        {/* Occupancy bar */}
        <div className="flex items-center gap-2.5 text-[10px] sm:text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-24 h-2 bg-muted/50 rounded-full overflow-hidden">
              <motion.div 
                className={cn("h-full rounded-full", occupancyPercent > 80 ? "bg-destructive" : occupancyPercent > 50 ? "bg-accent" : "bg-primary")}
                initial={{ width: 0 }}
                animate={{ width: `${occupancyPercent}%` }}
                transition={{ delay: 0.5, duration: 0.8 }}
              />
            </div>
            <span className="text-muted-foreground font-semibold whitespace-nowrap">{availableCount} left</span>
          </div>
        </div>
      </motion.div>

      {/* Seat Type Price Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {(['regular', 'premium', 'vip'] as const).map((type, i) => {
          const config = seatTypeConfig[type];
          const Icon = config.icon;
          const price = type === 'regular' ? '₹150' : type === 'premium' ? '₹250' : '₹400';
          return (
            <motion.div
              key={type}
              className={cn(
                "relative overflow-hidden rounded-xl p-2.5 sm:p-3 border bg-gradient-to-br text-center",
                config.color, config.border
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <Icon className="h-4 w-4 mx-auto mb-1 text-foreground/70" />
              <p className="text-[10px] sm:text-xs font-bold capitalize">{config.label}</p>
              <p className="text-xs sm:text-sm font-black cinema-gradient-text">{price}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Seats Grid */}
      <div className="overflow-x-auto pb-4 -mx-1 px-1 scrollbar-thin">
        <div className="flex flex-col items-center gap-0.5 sm:gap-1.5 min-w-fit">
          {sortedRows.map((row, rowIndex) => {
            const rowSeats = groupedSeats[row];
            const midpoint = Math.ceil(rowSeats.length / 2);
            const rowType = rowSeats[0]?.seat_type;
            
            return (
              <motion.div 
                key={row} 
                className="flex items-center gap-0.5 sm:gap-2"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rowIndex * 0.03 }}
              >
                <span className={cn(
                  "w-5 sm:w-7 text-[10px] sm:text-xs font-bold text-right transition-colors",
                  rowType === 'vip' ? 'text-purple-400/70' : rowType === 'premium' ? 'text-amber-400/70' : 'text-muted-foreground'
                )}>{row}</span>
                <div className="flex gap-[2px] sm:gap-1">
                  {rowSeats.map((seat, seatIdx) => {
                    const isBooked = bookedSeatIds.includes(seat.id);
                    const isSelected = selectedSeats.some((s) => s.id === seat.id);
                    const isHovered = hoveredSeat === seat.id;
                    const isAisle = seatIdx === midpoint - 1;

                    return (
                      <div key={seat.id} className={cn("flex", isAisle && "mr-2 sm:mr-4")}>
                        <motion.button
                          onClick={() => handleSeatClick(seat)}
                          onMouseEnter={() => !isBooked && setHoveredSeat(seat.id)}
                          onMouseLeave={() => setHoveredSeat(null)}
                          disabled={isBooked}
                          whileTap={!isBooked ? { scale: 0.85 } : undefined}
                          whileHover={!isBooked ? { scale: 1.2, y: -3 } : undefined}
                          animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 0.25 }}
                          className={cn(
                            'relative w-5 h-5 sm:w-8 sm:h-8 rounded-md text-[8px] sm:text-[10px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                            isBooked && 'bg-muted/20 cursor-not-allowed opacity-20',
                            isSelected && 'bg-primary text-primary-foreground shadow-lg shadow-primary/40 ring-2 ring-primary/30',
                            !isBooked && !isSelected && seat.seat_type === 'vip' && 'bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30',
                            !isBooked && !isSelected && seat.seat_type === 'premium' && 'bg-amber-500/12 border border-amber-500/25 text-amber-300 hover:bg-amber-500/25',
                            !isBooked && !isSelected && seat.seat_type === 'regular' && 'bg-secondary/60 border border-border/40 hover:bg-primary/20 hover:border-primary/30',
                          )}
                          aria-label={`${row}${seat.seat_number}, ${seat.seat_type}, ₹${seat.price}${isBooked ? ', taken' : isSelected ? ', selected' : ''}`}
                          aria-pressed={isSelected}
                        >
                          {seat.seat_number}
                          {isSelected && (
                            <motion.div
                              className="absolute inset-0 rounded-md bg-primary/20"
                              animate={{ opacity: [0.5, 0, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                        </motion.button>
                      </div>
                    );
                  })}
                </div>
                <span className={cn(
                  "w-5 sm:w-7 text-[10px] sm:text-xs font-bold transition-colors",
                  rowType === 'vip' ? 'text-purple-400/70' : rowType === 'premium' ? 'text-amber-400/70' : 'text-muted-foreground'
                )}>{row}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selection Summary - Enhanced */}
      <AnimatePresence>
        {selectedSeats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 15, height: 0 }}
            className="space-y-3"
          >
            {/* Selected seats badges */}
            <div className="flex flex-wrap justify-center gap-1.5">
              {selectedSeats.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[10px] sm:text-xs font-bold cursor-pointer hover:bg-destructive/10 hover:border-destructive/30 transition-colors",
                      s.seat_type === 'vip' ? 'border-purple-500/40 bg-purple-500/10' :
                      s.seat_type === 'premium' ? 'border-amber-500/30 bg-amber-500/10' :
                      'border-primary/30 bg-primary/5'
                    )}
                    onClick={() => handleSeatClick(s)}
                  >
                    {s.row_label}{s.seat_number} ×
                  </Badge>
                </motion.div>
              ))}
            </div>

            {/* Type breakdown */}
            <div className="flex flex-wrap justify-center gap-2">
              {Object.entries(selectedByType).map(([type, typeSeats]) => {
                const config = seatTypeConfig[type as keyof typeof seatTypeConfig];
                const Icon = config?.icon || Armchair;
                const total = typeSeats.reduce((sum, s) => sum + Number(s.price), 0);
                return (
                  <div key={type} className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    <span className="capitalize">{type} × {typeSeats.length}</span>
                    <span className="font-bold text-foreground">₹{total}</span>
                  </div>
                );
              })}
            </div>

            {/* Total pill */}
            <motion.div layout className="flex justify-center">
              <Badge className="cinema-gradient text-primary-foreground px-6 py-2.5 text-sm shadow-xl shadow-primary/25 font-black rounded-full">
                {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} • ₹{selectedSeats.reduce((sum, s) => sum + Number(s.price), 0)}
              </Badge>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
