import { useState } from 'react';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { Calendar, Clock, MapPin } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Date Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="text-sm font-medium">Select Date</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((date) => {
            const isSelected = isSameDay(date, selectedDate);
            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  'flex flex-col items-center min-w-[70px] p-3 rounded-lg border transition-all',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:border-primary/50'
                )}
              >
                <span className="text-xs font-medium uppercase">
                  {format(date, 'EEE')}
                </span>
                <span className="text-lg font-bold">{format(date, 'd')}</span>
                <span className="text-xs">{format(date, 'MMM')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Theatres and Showtimes */}
      <div className="space-y-4">
        {Object.entries(groupedByTheatre).length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-8 text-center text-muted-foreground">
              No shows available for this date
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedByTheatre).map(([theatreName, { theatre, showtimes: theatreShowtimes }]) => (
            <Card key={theatreName} className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-start justify-between">
                  <div>
                    <span>{theatreName}</span>
                    {theatre && (
                      <div className="flex items-center gap-1 text-sm font-normal text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{theatre.location}, {theatre.city}</span>
                      </div>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {theatreShowtimes
                    .sort((a, b) => a.show_time.localeCompare(b.show_time))
                    .map((st) => {
                      const isSelected = selectedShowtime?.id === st.id;
                      const formattedTime = format(
                        parseISO(`2000-01-01T${st.show_time}`),
                        'h:mm a'
                      );
                      return (
                        <Button
                          key={st.id}
                          variant={isSelected ? 'default' : 'outline'}
                          className={cn(
                            'min-w-[100px]',
                            isSelected && 'cinema-gradient'
                          )}
                          onClick={() => onSelect(st)}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {formattedTime}
                        </Button>
                      );
                    })}
                </div>
                {theatreShowtimes[0]?.screen && (
                  <Badge variant="secondary" className="mt-3">
                    {theatreShowtimes[0].screen.name}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
