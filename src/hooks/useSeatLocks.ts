import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SeatLock {
  seat_id: string;
  user_id: string;
  expires_at: string;
}

interface UseSeatLocksResult {
  locks: Map<string, SeatLock>; // key: seat_id
  bookedSeatIds: Set<string>;
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Subscribes to realtime seat_locks + booked_seats for a showtime.
 * Also purges expired locks + ended-show locks on mount.
 */
export function useSeatLocks(showtimeId: string | undefined, currentUserId?: string): UseSeatLocksResult {
  const [locks, setLocks] = useState<Map<string, SeatLock>>(new Map());
  const [bookedSeatIds, setBookedSeatIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const expiryTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const scheduleExpiry = useCallback((seatId: string, expiresAt: string) => {
    const timers = expiryTimersRef.current;
    const existing = timers.get(seatId);
    if (existing) clearTimeout(existing);
    const ms = Math.max(0, new Date(expiresAt).getTime() - Date.now());
    const t = setTimeout(() => {
      setLocks((prev) => {
        const next = new Map(prev);
        const l = next.get(seatId);
        if (l && new Date(l.expires_at).getTime() <= Date.now()) next.delete(seatId);
        return next;
      });
      timers.delete(seatId);
    }, ms + 250);
    timers.set(seatId, t);
  }, []);

  const fetchAll = useCallback(async () => {
    if (!showtimeId) return;
    // Lazy cleanup on the server for this showtime
    await supabase.rpc('cleanup_showtime_if_ended', { p_showtime_id: showtimeId });

    const [locksRes, bookedRes] = await Promise.all([
      supabase
        .from('seat_locks')
        .select('seat_id, user_id, expires_at')
        .eq('showtime_id', showtimeId)
        .gt('expires_at', new Date().toISOString()),
      supabase.from('booked_seats').select('seat_id').eq('showtime_id', showtimeId),
    ]);

    const lockMap = new Map<string, SeatLock>();
    (locksRes.data ?? []).forEach((l: any) => {
      lockMap.set(l.seat_id, l);
      scheduleExpiry(l.seat_id, l.expires_at);
    });
    setLocks(lockMap);
    setBookedSeatIds(new Set((bookedRes.data ?? []).map((b: any) => b.seat_id)));
    setLoading(false);
  }, [showtimeId, scheduleExpiry]);

  useEffect(() => {
    if (!showtimeId) return;
    setLoading(true);
    fetchAll();

    const channel = supabase
      .channel(`seat-state-${showtimeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'seat_locks', filter: `showtime_id=eq.${showtimeId}` },
        (payload) => {
          setLocks((prev) => {
            const next = new Map(prev);
            if (payload.eventType === 'DELETE') {
              const seatId = (payload.old as any)?.seat_id;
              if (seatId) next.delete(seatId);
            } else {
              const row = payload.new as any;
              if (row?.seat_id && new Date(row.expires_at).getTime() > Date.now()) {
                next.set(row.seat_id, {
                  seat_id: row.seat_id,
                  user_id: row.user_id,
                  expires_at: row.expires_at,
                });
                scheduleExpiry(row.seat_id, row.expires_at);
              }
            }
            return next;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'booked_seats', filter: `showtime_id=eq.${showtimeId}` },
        (payload) => {
          const seatId = (payload.new as any)?.seat_id;
          if (!seatId) return;
          setBookedSeatIds((prev) => {
            const next = new Set(prev);
            next.add(seatId);
            return next;
          });
          setLocks((prev) => {
            const next = new Map(prev);
            next.delete(seatId);
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      expiryTimersRef.current.forEach((t) => clearTimeout(t));
      expiryTimersRef.current.clear();
    };
  }, [showtimeId, fetchAll, scheduleExpiry]);

  return { locks, bookedSeatIds, loading, refresh: fetchAll };
}
