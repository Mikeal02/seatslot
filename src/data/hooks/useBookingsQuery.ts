import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk, staleTime } from '@/data/queryKeys';
import { bookingsRepository } from '@/data/repositories/bookings.repo';
import type { Booking } from '@/types/database';

export function useUserBookings(userId: string | undefined) {
  return useQuery<Booking[]>({
    queryKey: qk.bookings.byUser(userId),
    queryFn: () => bookingsRepository.listForUser(userId as string),
    enabled: Boolean(userId),
    staleTime: staleTime.session,
  });
}

export function useCancelBooking(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => bookingsRepository.cancel(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.bookings.byUser(userId) });
      queryClient.invalidateQueries({ queryKey: qk.seats.all });
    },
  });
}
