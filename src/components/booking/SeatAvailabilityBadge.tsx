import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface SeatAvailabilityBadgeProps {
  showtimeId: string;
  screenId: string;
}

export function SeatAvailabilityBadge({ showtimeId, screenId }: SeatAvailabilityBadgeProps) {
  const [available, setAvailable] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    fetchAvailability();
  }, [showtimeId, screenId]);

  const fetchAvailability = async () => {
    const [seatsRes, bookedRes] = await Promise.all([
      supabase.from('seats').select('id', { count: 'exact', head: true }).eq('screen_id', screenId),
      supabase.from('booked_seats').select('id', { count: 'exact', head: true }).eq('showtime_id', showtimeId),
    ]);

    const totalSeats = seatsRes.count || 0;
    const bookedSeats = bookedRes.count || 0;
    setTotal(totalSeats);
    setAvailable(totalSeats - bookedSeats);
  };

  if (available === null || total === null) return null;

  const percentage = total > 0 ? (available / total) * 100 : 100;
  const isLow = percentage < 30;
  const isSoldOut = available === 0;

  if (isSoldOut) {
    return (
      <Badge variant="destructive" className="text-[9px] sm:text-[10px] h-4 sm:h-5 px-1.5">
        Sold Out
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={`text-[9px] sm:text-[10px] h-4 sm:h-5 px-1.5 gap-0.5 ${
        isLow ? 'border-destructive/50 text-destructive' : 'border-accent/50 text-accent-foreground'
      }`}
    >
      <Users className="h-2.5 w-2.5" />
      {available}/{total}
    </Badge>
  );
}
