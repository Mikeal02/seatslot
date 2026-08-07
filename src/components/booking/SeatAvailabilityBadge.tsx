import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { useSeatAvailability } from '@/data';

interface SeatAvailabilityBadgeProps {
  showtimeId: string;
  screenId: string;
}

export function SeatAvailabilityBadge({ showtimeId, screenId }: SeatAvailabilityBadgeProps) {
  const { data } = useSeatAvailability(showtimeId, screenId);

  if (!data) return null;

  const { available, total } = data;
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
