import { supabase } from '@/integrations/supabase/client';

export interface SeatAvailability {
  total: number;
  booked: number;
  available: number;
}

/**
 * Note: counts are read with the head/count pattern. The badge treats a failed
 * count as zero rather than surfacing an error, so this repository is
 * intentionally lenient.
 */
export const seatsRepository = {
  async availability(showtimeId: string, screenId: string): Promise<SeatAvailability> {
    const [seatsRes, bookedRes] = await Promise.all([
      supabase.from('seats').select('id', { count: 'exact', head: true }).eq('screen_id', screenId),
      supabase
        .from('booked_seats')
        .select('id', { count: 'exact', head: true })
        .eq('showtime_id', showtimeId),
    ]);

    const total = seatsRes.count || 0;
    const booked = bookedRes.count || 0;
    return { total, booked, available: total - booked };
  },
};
