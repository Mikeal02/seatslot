
-- Drop old versions to remove any stale/inconsistent definitions
DROP FUNCTION IF EXISTS public.acquire_seat_locks(uuid, uuid[]);
DROP FUNCTION IF EXISTS public.release_seat_locks(uuid, uuid[]);
DROP FUNCTION IF EXISTS public.cleanup_showtime_if_ended(uuid);

-- acquire_seat_locks: atomic per-seat upsert; returns server expires_at
CREATE FUNCTION public.acquire_seat_locks(
  p_showtime_id uuid,
  p_seat_ids uuid[]
)
RETURNS TABLE(
  seat_id uuid,
  success boolean,
  reason text,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_seat uuid;
  v_show_end timestamptz;
  v_new_expiry timestamptz;
  v_updated_expiry timestamptz;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lazy cleanup: purge expired locks for this showtime
  DELETE FROM public.seat_locks sl
   WHERE sl.showtime_id = p_showtime_id AND sl.expires_at < now();

  -- Lazy cleanup: if show already ended, purge all its locks and stop
  SELECT (s.show_date + s.show_time + (COALESCE(m.duration_minutes, 180) || ' minutes')::interval)
    INTO v_show_end
    FROM public.showtimes s
    LEFT JOIN public.movies m ON m.id = s.movie_id
   WHERE s.id = p_showtime_id;

  IF v_show_end IS NOT NULL AND v_show_end < now() THEN
    DELETE FROM public.seat_locks sl WHERE sl.showtime_id = p_showtime_id;
    FOREACH v_seat IN ARRAY p_seat_ids LOOP
      seat_id := v_seat; success := false; reason := 'show_ended'; expires_at := NULL;
      RETURN NEXT;
    END LOOP;
    RETURN;
  END IF;

  v_new_expiry := now() + interval '10 minutes';

  FOREACH v_seat IN ARRAY p_seat_ids LOOP
    -- Reject if already permanently booked
    IF EXISTS (
      SELECT 1 FROM public.booked_seats bs
       WHERE bs.showtime_id = p_showtime_id AND bs.seat_id = v_seat
    ) THEN
      seat_id := v_seat; success := false; reason := 'already_booked'; expires_at := NULL;
      RETURN NEXT;
      CONTINUE;
    END IF;

    -- Atomic upsert: insert new lock, OR refresh if it's already ours.
    -- If another user holds it, the UNIQUE constraint conflicts and the
    -- WHERE guard blocks the update, leaving 0 rows returned.
    INSERT INTO public.seat_locks AS sl (showtime_id, seat_id, user_id, locked_at, expires_at)
    VALUES (p_showtime_id, v_seat, v_user, now(), v_new_expiry)
    ON CONFLICT (showtime_id, seat_id) DO UPDATE
      SET expires_at = EXCLUDED.expires_at,
          locked_at  = EXCLUDED.locked_at
      WHERE sl.user_id = v_user
    RETURNING sl.expires_at INTO v_updated_expiry;

    IF v_updated_expiry IS NOT NULL THEN
      seat_id := v_seat; success := true; reason := NULL; expires_at := v_updated_expiry;
    ELSE
      seat_id := v_seat; success := false; reason := 'locked_by_other'; expires_at := NULL;
    END IF;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- release_seat_locks: only deletes caller's own locks
CREATE FUNCTION public.release_seat_locks(
  p_showtime_id uuid,
  p_seat_ids uuid[]
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_deleted integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  DELETE FROM public.seat_locks sl
   WHERE sl.showtime_id = p_showtime_id
     AND sl.user_id = v_user
     AND sl.seat_id = ANY(p_seat_ids);

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- cleanup_showtime_if_ended: lazy cleanup RPC (called on seat page mount)
CREATE FUNCTION public.cleanup_showtime_if_ended(p_showtime_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_show_end timestamptz;
BEGIN
  SELECT (s.show_date + s.show_time + (COALESCE(m.duration_minutes, 180) || ' minutes')::interval)
    INTO v_show_end
    FROM public.showtimes s
    LEFT JOIN public.movies m ON m.id = s.movie_id
   WHERE s.id = p_showtime_id;

  IF v_show_end IS NOT NULL AND v_show_end < now() THEN
    DELETE FROM public.seat_locks sl WHERE sl.showtime_id = p_showtime_id;
  END IF;

  DELETE FROM public.seat_locks sl
   WHERE sl.showtime_id = p_showtime_id AND sl.expires_at < now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.acquire_seat_locks(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_seat_locks(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_showtime_if_ended(uuid) TO authenticated, anon;

-- Ensure realtime + full row payloads (required for DELETE payload filters to work)
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.seat_locks;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.booked_seats;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

ALTER TABLE public.seat_locks REPLICA IDENTITY FULL;
ALTER TABLE public.booked_seats REPLICA IDENTITY FULL;
