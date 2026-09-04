import { supabase } from "@/integrations/supabase/client";

export interface SeatAvailability {
  total: number;
  booked: number;
  locked: number;
  available: number;
}

/**
 * Note: counts are read with the head/count pattern. The badge treats a failed
 * count as zero rather than surfacing an error, so this repository is
 * intentionally lenient. Active (unexpired) seat locks count as unavailable so
 * a fully-held show never advertises free seats.
 */
export const seatsRepository = {
  async availability(
    showtimeId: string,
    screenId: string,
  ): Promise<SeatAvailability> {
    const nowIso = new Date().toISOString();
    const [seatsRes, bookedRes, lockedRes] = await Promise.all([
      supabase
        .from("seats")
        .select("id", { count: "exact", head: true })
        .eq("screen_id", screenId),
      supabase
        .from("booked_seats")
        .select("id", { count: "exact", head: true })
        .eq("showtime_id", showtimeId),
      supabase
        .from("seat_locks")
        .select("id", { count: "exact", head: true })
        .eq("showtime_id", showtimeId)
        .gt("expires_at", nowIso),
    ]);

    const total = seatsRes.count || 0;
    const booked = bookedRes.count || 0;
    const locked = lockedRes.count || 0;
    const available = Math.max(0, total - booked - locked);
    return { total, booked, locked, available };
  },
};

