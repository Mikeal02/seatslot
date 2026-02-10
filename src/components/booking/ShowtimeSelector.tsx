import { useState } from 'react';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Showtime } from '@/types/database';
import { cn } from '@/lib/utils';

interface ShowtimeSelectorProps {
  showtimes: Showtime[];
  selectedShowtime: Showtime | null;
  onSelect: (showtime: Showtime) => void;
}

export function ShowtimeSelector({
  showtimes,
  selectedShowtime,
  onSelect,
}: ShowtimeSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  // Filter showtimes by selected date
  const filteredShowtimes = showtimes.filter((st) =>
    isSameDay(parseISO(st.show_date), selectedDate)
  );

  // Group showtimes by theatre
  const groupedByTheatre = filteredShowtimes.reduce((acc, st) => {
    const theatreName = st.screen?.theatre?.name || 'Unknown Theatre';
    if (!acc[theatreName]) {
      acc[theatreName] = {
        theatre: st.screen?.theatre,
        showtimes: [],
      };
    }
    acc[theatreName].showtimes.push(st);
    return acc;
  }, {} as Record<string, { theatre: any; showtimes: Showtime[] }>);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Date Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="text-sm font-medium">Select Date</span>
        </div>
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-thin -mx-1 px-1">
          {dates.map((date) => {
            const isSelected = isSameDay(date, selectedDate);
            const hasShows = showtimes.some((st) => isSameDay(parseISO(st.show_date), date));
            return (
              <motion.button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'flex flex-col items-center min-w-[52px] sm:min-w-[68px] p-1.5 sm:p-3 rounded-lg border transition-all shrink-0',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25'
                    : hasShows
                    ? 'bg-card border-border hover:border-primary/50'
                    : 'bg-card border-border/50 opacity-50'
                )}
              >
                <span className="text-[9px] sm:text-xs font-medium uppercase">
                  {format(date, 'EEE')}
                </span>
                <span className="text-sm sm:text-lg font-bold">{format(date, 'd')}</span>
                <span className="text-[9px] sm:text-xs">{format(date, 'MMM')}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Theatres and Showtimes */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={selectedDate.toISOString()}
          className="space-y-3 sm:space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {Object.entries(groupedByTheatre).length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No shows available for this date</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedByTheatre).map(([theatreName, { theatre, showtimes: theatreShowtimes }], idx) => (
              <motion.div
                key={theatreName}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-card border-border glow-card overflow-visible">
                  <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-5">
                    <CardTitle className="text-sm sm:text-lg flex flex-col gap-0.5 sm:gap-1">
                      <span className="line-clamp-1">{theatreName}</span>
                      {theatre && (
                        <div className="flex items-center gap-1 text-[10px] sm:text-sm font-normal text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{theatre.location}, {theatre.city}</span>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-5">
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {theatreShowtimes
                        .sort((a, b) => a.show_time.localeCompare(b.show_time))
                        .map((st) => {
                          const isSelected = selectedShowtime?.id === st.id;
                          const formattedTime = format(
                            parseISO(`2000-01-01T${st.show_time}`),
                            'h:mm a'
                          );
                          return (
                            <motion.div key={st.id} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant={isSelected ? 'default' : 'outline'}
                                size="sm"
                                className={cn(
                                  'min-w-[72px] sm:min-w-[100px] text-[11px] sm:text-sm h-8 sm:h-9 px-2 sm:px-3',
                                  isSelected && 'cinema-gradient shadow-md shadow-primary/20'
                                )}
                                onClick={() => onSelect(st)}
                              >
                                <Clock className="h-3 w-3 mr-1 shrink-0" />
                                {formattedTime}
                              </Button>
                            </motion.div>
                          );
                        })}
                    </div>
                    {theatreShowtimes[0]?.screen && (
                      <Badge variant="secondary" className="mt-2 sm:mt-3 text-[10px] sm:text-xs">
                        {theatreShowtimes[0].screen.name}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}