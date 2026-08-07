import { useQuery } from '@tanstack/react-query';
import { qk, staleTime } from '@/data/queryKeys';
import { seatsRepository, type SeatAvailability } from '@/data/repositories/seats.repo';

export function useSeatAvailability(showtimeId: string, screenId: string) {
  return useQuery<SeatAvailability>({
    queryKey: qk.seats.availability(showtimeId, screenId),
    queryFn: () => seatsRepository.availability(showtimeId, screenId),
    enabled: Boolean(showtimeId && screenId),
    staleTime: staleTime.realtime,
  });
}
