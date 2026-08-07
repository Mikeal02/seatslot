import { supabase } from '@/integrations/supabase/client';
import { unwrapList, sel } from '@/data/core/query';
import type { Booking } from '@/types/database';

const SCOPE = 'bookings';

const BOOKING_SELECT = sel(
  '*, showtime:showtimes(*, movie:movies(*), screen:screens(*, theatre:theatres(*))), booked_seats(*, seat:seats(*))'
);

export const bookingsRepository = {
  /** Bookings owned by a user, newest first. RLS scopes this to the caller. */
  async listForUser(userId: string): Promise<Booking[]> {
    return unwrapList<Booking>(
      SCOPE,
      supabase
        .from('bookings')
        .select(BOOKING_SELECT)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .returns<Booking[]>()
    );
  },

  /** Cancel via SECURITY DEFINER RPC — clients may not update bookings directly. */
  async cancel(bookingId: string): Promise<void> {
    const { error } = await supabase.rpc('cancel_booking', { p_booking_id: bookingId });
    if (error) throw error;
  },
};
