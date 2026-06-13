import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
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
  regular: { icon: Armchair, label: 'Regular', color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/30' },
  premium: { icon: Star, label: 'Premium', color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/40' },
  vip: { icon: Crown, label: 'VIP', color: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/50' },
};

// Sizing bounds (px)
const SEAT_MIN = 20;
const SEAT_MAX = 36;
const GAP_MIN = 2;
const GAP_MAX = 6;
const ROW_LABEL_MIN = 18;
const ROW_LABEL_MAX = 28;

export function SeatSelection({ seats, bookedSeatIds, selectedSeats, onSelectionChange }: SeatSelectionProps) {
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Group + sort seats
  const { groupedSeats, sortedRows, maxSeatsPerRow } = useMemo(() => {
    const grouped = seats.reduce((acc, seat) => {
      (acc[seat.row_label] ||= []).push(seat);
      return acc;
    }, {} as Record<string, Seat[]>);
    Object.keys(grouped).forEach((row) =>
      grouped[row].sort((a, b) => a.seat_number - b.seat_number)
    );
    const rows = Object.keys(grouped).sort();
    const maxLen = rows.reduce((m, r) => Math.max(m, grouped[r].length), 0);
    return { groupedSeats: grouped, sortedRows: rows, maxSeatsPerRow: maxLen };
  }, [seats]);

  // Observe container width to fit seats without overflow / layout shift
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute optimal seat size so the whole row fits the container
  const { seatSize, gap, rowLabelW, aisleW } = useMemo(() => {
    if (!containerWidth || !maxSeatsPerRow) {
      return { seatSize: SEAT_MAX, gap: GAP_MAX, rowLabelW: ROW_LABEL_MAX, aisleW: 16 };
    }
    // try several gap sizes (bigger is nicer); pick the largest that fits
    for (let g = GAP_MAX; g >= GAP_MIN; g--) {
      for (let label = ROW_LABEL_MAX; label >= ROW_LABEL_MIN; label -= 2) {
        const aisle = Math.max(8, g * 3);
        // total = 2 row labels + gaps between row label and seats + (n-1) gaps between seats + aisle gap + seats
        const fixed = label * 2 + g * 2 + aisle + g * (maxSeatsPerRow - 1);
        const available = containerWidth - fixed;
        const size = Math.floor(available / maxSeatsPerRow);
        if (size >= SEAT_MIN) {
          return {
            seatSize: Math.min(size, SEAT_MAX),
            gap: g,
            rowLabelW: label,
            aisleW: aisle,
          };
        }
      }
    }
    // Fallback: minimum size, allow horizontal scroll
    return { seatSize: SEAT_MIN, gap: GAP_MIN, rowLabelW: ROW_LABEL_MIN, aisleW: 8 };
  }, [containerWidth, maxSeatsPerRow]);

  const handleSeatClick = (seat: Seat) => {
    if (bookedSeatIds.includes(seat.id)) return;
    const isSelected = selectedSeats.some((s) => s.id === seat.id);
    onSelectionChange(
      isSelected ? selectedSeats.filter((s) => s.id !== seat.id) : [...selectedSeats, seat]
    );
  };

  const totalSeats = seats.length;
  const bookedCount = bookedSeatIds.length;
  const availableCount = totalSeats - bookedCount;
  const occupancyPercent = totalSeats > 0 ? Math.round((bookedCount / totalSeats) * 100) : 0;

  const selectedByType = selectedSeats.reduce((acc, s) => {
    (acc[s.seat_type] ||= []).push(s);
    return acc;
  }, {} as Record<string, Seat[]>);

  // Font size scales with seat size; hide labels if too tiny
  const seatFont = seatSize >= 28 ? 11 : seatSize >= 24 ? 10 : 9;
  const showSeatNumbers = seatSize >= 22;

  return (
    <div className="space-y-5 w-full overflow-hidden">
      {/* Cinematic Screen */}
      <div className="relative pt-2">
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.15)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative mx-4 sm:mx-12">
          <div className="h-1.5 bg-gradient-to-r from-transparent via-primary/80 to-transparent rounded-full shadow-[0_0_20px_hsl(var(--primary)/0.4)]" />
          <motion.div
            className="h-8 sm:h-12 bg-gradient-to-b from-primary/12 to-transparent rounded-b-[50%]"
            initial={{ opacity: 0, scaleX: 0.8 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          />
        </div>
        <p className="text-center text-[9px] sm:text-[10px] text-muted-foreground -mt-2 sm:-mt-4 font-bold tracking-[0.3em] uppercase">
          Screen This Way
        </p>
      </div>

      {/* Legend + Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-muted/20 border border-border/20">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] sm:text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-secondary/80 border border-border/50 flex items-center justify-center">
              <Armchair className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-primary shadow-md shadow-primary/40 flex items-center justify-center">
              <Zap className="h-2.5 w-2.5 text-primary-foreground" />
            </div>
            <span className="text-muted-foreground">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-muted/30 opacity-40" />
            <span className="text-muted-foreground">Taken</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-[10px] sm:text-xs">
          <div className="w-20 sm:w-24 h-2 bg-muted/50 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full',
                occupancyPercent > 80 ? 'bg-destructive' : occupancyPercent > 50 ? 'bg-accent' : 'bg-primary'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${occupancyPercent}%` }}
              transition={{ delay: 0.3, duration: 0.6 }}
            />
          </div>
          <span className="text-muted-foreground font-semibold whitespace-nowrap">{availableCount} left</span>
        </div>
      </div>

      {/* Price cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {(['regular', 'premium', 'vip'] as const).map((type) => {
          const config = seatTypeConfig[type];
          const Icon = config.icon;
          const price = type === 'regular' ? '₹150' : type === 'premium' ? '₹250' : '₹400';
          return (
            <div
              key={type}
              className={cn(
                'relative overflow-hidden rounded-xl p-2 sm:p-3 border bg-gradient-to-br text-center min-w-0',
                config.color,
                config.border
              )}
            >
              <Icon className="h-4 w-4 mx-auto mb-1 text-foreground/70" />
              <p className="text-[10px] sm:text-xs font-bold capitalize truncate">{config.label}</p>
              <p className="text-xs sm:text-sm font-black cinema-gradient-text">{price}</p>
            </div>
          );
        })}
      </div>

      {/* Seat grid container — measures width to compute fitting seat size */}
      <div
  ref={containerRef}
  className="w-full max-w-full overflow-x-auto overflow-y-visible pb-2 scrollbar-thin"
>
        <div
          className="flex flex-col items-center mx-auto"
          style={{ gap: `${gap}px`, width: '100%' }}
        >
          {sortedRows.map((row, rowIndex) => {
            const rowSeats = groupedSeats[row];
            const midpoint = Math.ceil(rowSeats.length / 2);
            const rowType = rowSeats[0]?.seat_type;

            return (
              <motion.div
                key={row}
                className="flex items-center"
                style={{ gap: `${gap}px` }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(rowIndex * 0.02, 0.4) }}
              >
                <span
                  className={cn(
                    'text-[10px] sm:text-xs font-bold text-right shrink-0 select-none',
                    rowType === 'vip'
                      ? 'text-purple-400/70'
                      : rowType === 'premium'
                      ? 'text-amber-400/70'
                      : 'text-muted-foreground'
                  )}
                  style={{ width: `${rowLabelW}px` }}
                >
                  {row}
                </span>

                <div className="flex items-center" style={{ gap: `${gap}px` }}>
                  {rowSeats.map((seat, seatIdx) => {
                    const isBooked = bookedSeatIds.includes(seat.id);
                    const isSelected = selectedSeats.some((s) => s.id === seat.id);
                    const isAisleAfter = seatIdx === midpoint - 1;

                    return (
                      <div
                        key={seat.id}
                        className="flex shrink-0"
                        style={{ marginRight: isAisleAfter ? `${aisleW - gap}px` : undefined }}
                      >
                        <motion.button
                          onClick={() => handleSeatClick(seat)}
                          onMouseEnter={() => !isBooked && setHoveredSeat(seat.id)}
                          onMouseLeave={() => setHoveredSeat(null)}
                          disabled={isBooked}
                          whileTap={!isBooked ? { scale: 0.9 } : undefined}
                          whileHover={!isBooked ? { scale: 1.12 } : undefined}
                          animate={isSelected ? { scale: [1, 1.08, 1] } : {}}
                          transition={{ duration: 0.2 }}
                          style={{
                            width: `${seatSize}px`,
                            height: `${seatSize}px`,
                            fontSize: `${seatFont}px`,
                            zIndex: hoveredSeat === seat.id || isSelected ? 5 : 1,
                          }}
                          className={cn(
                            'relative rounded-md font-bold leading-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary will-change-transform',
                            isBooked && 'bg-muted/20 cursor-not-allowed opacity-20',
                            isSelected && 'bg-primary text-primary-foreground shadow-md shadow-primary/40 ring-2 ring-primary/30',
                            !isBooked &&
                              !isSelected &&
                              seat.seat_type === 'vip' &&
                              'bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30',
                            !isBooked &&
                              !isSelected &&
                              seat.seat_type === 'premium' &&
                              'bg-amber-500/12 border border-amber-500/25 text-amber-300 hover:bg-amber-500/25',
                            !isBooked &&
                              !isSelected &&
                              seat.seat_type === 'regular' &&
                              'bg-secondary/60 border border-border/40 hover:bg-primary/20 hover:border-primary/30'
                          )}
                          aria-label={`${row}${seat.seat_number}, ${seat.seat_type}, ₹${seat.price}${
                            isBooked ? ', taken' : isSelected ? ', selected' : ''
                          }`}
                          aria-pressed={isSelected}
                        >
                          {showSeatNumbers ? seat.seat_number : ''}
                        </motion.button>
                      </div>
                    );
                  })}
                </div>

                <span
                  className={cn(
                    'text-[10px] sm:text-xs font-bold shrink-0 select-none',
                    rowType === 'vip'
                      ? 'text-purple-400/70'
                      : rowType === 'premium'
                      ? 'text-amber-400/70'
                      : 'text-muted-foreground'
                  )}
                  style={{ width: `${rowLabelW}px` }}
                >
                  {row}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selection summary */}
      <AnimatePresence>
        {selectedSeats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            className="space-y-3"
          >
            <div className="flex flex-wrap justify-center gap-1.5">
              {selectedSeats.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] sm:text-xs font-bold cursor-pointer hover:bg-destructive/10 hover:border-destructive/30 transition-colors',
                      s.seat_type === 'vip'
                        ? 'border-purple-500/40 bg-purple-500/10'
                        : s.seat_type === 'premium'
                        ? 'border-amber-500/30 bg-amber-500/10'
                        : 'border-primary/30 bg-primary/5'
                    )}
                    onClick={() => handleSeatClick(s)}
                  >
                    {s.row_label}
                    {s.seat_number} ×
                  </Badge>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5">
              {Object.entries(selectedByType).map(([type, typeSeats]) => {
                const config = seatTypeConfig[type as keyof typeof seatTypeConfig];
                const Icon = config?.icon || Armchair;
                const total = typeSeats.reduce((sum, s) => sum + Number(s.price), 0);
                return (
                  <div key={type} className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    <span className="capitalize">
                      {type} × {typeSeats.length}
                    </span>
                    <span className="font-bold text-foreground">₹{total}</span>
                  </div>
                );
              })}
            </div>

            <motion.div layout className="flex justify-center">
              <Badge className="cinema-gradient text-primary-foreground px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm shadow-xl shadow-primary/25 font-black rounded-full">
                {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} • ₹
                {selectedSeats.reduce((sum, s) => sum + Number(s.price), 0)}
              </Badge>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
