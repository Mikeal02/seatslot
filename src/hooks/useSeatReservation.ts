import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AcquireRow {
  seat_id: string;
  success: boolean;
  reason: string | null;
}

export interface ReserveResult {
  ok: boolean;
  failed: { seatId: string; reason: string | null }[];
}

/**
 * Wraps acquire_seat_locks / release_seat_locks RPCs.
 * Tracks user's currently-held locks so we can auto-release on unmount / unload.
 */
export function useSeatReservation(showtimeId: string | undefined) {
  const heldSeatsRef = useRef<Set<string>>(new Set());
  const paymentInitiatedRef = useRef(false);
  const [earliestExpiry, setEarliestExpiryState] = useState<number | null>(null);
  const expiryMapRef = useRef<Map<string, number>>(new Map());

  const recomputeEarliest = useCallback(() => {
    let min: number | null = null;
    expiryMapRef.current.forEach((v) => {
      if (min === null || v < min) min = v;
    });
    setEarliestExpiryState(min);
  }, []);

  const reserve = useCallback(
    async (seatIds: string[]): Promise<ReserveResult> => {
      if (!showtimeId || seatIds.length === 0) return { ok: true, failed: [] };
      const { data, error } = await supabase.rpc('acquire_seat_locks', {
        p_showtime_id: showtimeId,
        p_seat_ids: seatIds,
      });
      if (error) {
        return { ok: false, failed: seatIds.map((id) => ({ seatId: id, reason: error.message })) };
      }
      const rows = (data ?? []) as AcquireRow[];
      const failed: { seatId: string; reason: string | null }[] = [];
      const expiresAt = Date.now() + 10 * 60 * 1000;
      rows.forEach((r) => {
        if (r.success) {
          heldSeatsRef.current.add(r.seat_id);
          expiryMapRef.current.set(r.seat_id, expiresAt);
        } else {
          failed.push({ seatId: r.seat_id, reason: r.reason });
        }
      });
      recomputeEarliest();
      return { ok: failed.length === 0, failed };
    },
    [showtimeId, recomputeEarliest]
  );

  const release = useCallback(
    async (seatIds: string[]) => {
      if (!showtimeId || seatIds.length === 0) return;
      await supabase.rpc('release_seat_locks', {
        p_showtime_id: showtimeId,
        p_seat_ids: seatIds,
      });
      seatIds.forEach((id) => {
        heldSeatsRef.current.delete(id);
        expiryMapRef.current.delete(id);
      });
      recomputeEarliest();
    },
    [showtimeId, recomputeEarliest]
  );

  const releaseAll = useCallback(async () => {
    const ids = Array.from(heldSeatsRef.current);
    if (ids.length === 0) return;
    await release(ids);
  }, [release]);

  const markPaymentInitiated = useCallback(() => {
    paymentInitiatedRef.current = true;
  }, []);

  // Auto-release on tab close (best-effort via keepalive fetch to Supabase REST)
  useEffect(() => {
    const handler = () => {
      if (paymentInitiatedRef.current) return;
      const ids = Array.from(heldSeatsRef.current);
      if (ids.length === 0 || !showtimeId) return;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/release_seat_locks`;
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      const token = supabase.auth.getSession ? undefined : undefined;
      // Use fetch with keepalive; auth via bearer from current session
      supabase.auth.getSession().then(({ data }) => {
        const jwt = data.session?.access_token ?? key;
        fetch(url, {
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
            apikey: key,
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({ p_showtime_id: showtimeId, p_seat_ids: ids }),
        }).catch(() => {});
      });
    };
    window.addEventListener('pagehide', handler);
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('pagehide', handler);
      window.removeEventListener('beforeunload', handler);
    };
  }, [showtimeId]);

  // Release on unmount (route change) unless payment initiated
  useEffect(() => {
    return () => {
      if (paymentInitiatedRef.current) return;
      const ids = Array.from(heldSeatsRef.current);
      if (ids.length > 0 && showtimeId) {
        supabase.rpc('release_seat_locks', {
          p_showtime_id: showtimeId,
          p_seat_ids: ids,
        });
      }
    };
  }, [showtimeId]);

  return { reserve, release, releaseAll, markPaymentInitiated, earliestExpiry };
}
