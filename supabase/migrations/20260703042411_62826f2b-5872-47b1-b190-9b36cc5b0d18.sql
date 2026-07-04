
-- 1. seat_locks table
CREATE TABLE IF NOT EXISTS public.seat_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  showtime_id uuid NOT NULL REFERENCES public.showtimes(id) ON DELETE CASCADE,
  seat_id uuid NOT NULL REFERENCES public.seats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  locked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  CONSTRAINT seat_locks_unique_show_seat UNIQUE (showtime_id, seat_id)
);

CREATE INDEX IF NOT EXISTS seat_locks_expires_at_idx ON public.seat_locks(expires_at);
CREATE INDEX IF NOT EXISTS seat_locks_showtime_idx ON public.seat_locks(showtime_id);
CREATE INDEX IF NOT EXISTS seat_locks_user_idx ON public.seat_locks(user_id);

GRANT SELECT, INSERT, DELETE ON public.seat_locks TO authenticated;
GRANT SELECT ON public.seat_locks TO anon;
GRANT ALL ON public.seat_locks TO service_role;

ALTER TABLE public.seat_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seat locks"
  ON public.seat_locks FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own seat locks"
  ON public.seat_locks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own or expired seat locks"
  ON public.seat_locks FOR DELETE
  USING (auth.uid() = user_id OR expires_at < now());

-- 2. Race-condition guard on permanent bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'booked_seats_unique_show_seat'
  ) THEN
    ALTER TABLE public.booked_seats
      ADD CONSTRAINT booked_seats_unique_show_seat
      UNIQUE (showtime_id, seat_id);
  END IF;
END $$;

-- 3. RPC: acquire_seat_locks
CREATE OR REPLACE FUNCTION public.acquire_seat_locks(
    p_showtime_id uuid,
    p_seat_ids uuid[]
)
RETURNS TABLE (
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
BEGIN
    ------------------------------------------------------------------------
    -- Authentication
    ------------------------------------------------------------------------
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    ------------------------------------------------------------------------
    -- Remove expired locks for this showtime
    ------------------------------------------------------------------------
    DELETE FROM public.seat_locks sl
    WHERE sl.showtime_id = p_showtime_id
      AND sl.expires_at < now();

    ------------------------------------------------------------------------
    -- Check whether show has already ended
    ------------------------------------------------------------------------
    SELECT
        (
            s.show_date
            + s.show_time
            + (COALESCE(m.duration_minutes, 180) || ' minutes')::interval
        )
    INTO v_show_end
    FROM public.showtimes s
    LEFT JOIN public.movies m
        ON m.id = s.movie_id
    WHERE s.id = p_showtime_id;

    IF v_show_end IS NOT NULL
       AND v_show_end < now()
    THEN
        DELETE FROM public.seat_locks
        WHERE showtime_id = p_showtime_id;

        FOREACH v_seat IN ARRAY p_seat_ids
        LOOP
            seat_id := v_seat;
            success := false;
            reason := 'show_ended';
            expires_at := NULL;
            RETURN NEXT;
        END LOOP;

        RETURN;
    END IF;

    ------------------------------------------------------------------------
    -- Process each requested seat
    ------------------------------------------------------------------------
    FOREACH v_seat IN ARRAY p_seat_ids
    LOOP

        --------------------------------------------------------------------
        -- Already permanently booked?
        --------------------------------------------------------------------
        IF EXISTS (
            SELECT 1
            FROM public.booked_seats bs
            WHERE bs.showtime_id = p_showtime_id
              AND bs.seat_id = v_seat
        ) THEN
            seat_id := v_seat;
            success := false;
            reason := 'already_booked';
            expires_at := NULL;

            RETURN NEXT;
            CONTINUE;
        END IF;

        --------------------------------------------------------------------
        -- Try to create a new lock
        --------------------------------------------------------------------
        BEGIN

            INSERT INTO public.seat_locks (
                showtime_id,
                seat_id,
                user_id
            )
            VALUES (
                p_showtime_id,
                v_seat,
                v_user
            )
            RETURNING seat_locks.expires_at
            INTO expires_at;

            seat_id := v_seat;
            success := true;
            reason := NULL;

            RETURN NEXT;

        EXCEPTION
            WHEN unique_violation THEN

                ----------------------------------------------------------------
                -- Lock already exists
                ----------------------------------------------------------------

                IF EXISTS (
                    SELECT 1
                    FROM public.seat_locks sl
                    WHERE sl.showtime_id = p_showtime_id
                      AND sl.seat_id = v_seat
                      AND sl.user_id = v_user
                ) THEN

                    ------------------------------------------------------------
                    -- Refresh own lock
                    ------------------------------------------------------------
                    UPDATE public.seat_locks sl
                    SET
                        locked_at = now(),
                        expires_at = now() + interval '10 minutes'
                    WHERE sl.showtime_id = p_showtime_id
                      AND sl.seat_id = v_seat
                      AND sl.user_id = v_user
                    RETURNING sl.expires_at
                    INTO expires_at;

                    seat_id := v_seat;
                    success := true;
                    reason := NULL;

                    RETURN NEXT;

                ELSE

                    ------------------------------------------------------------
                    -- Locked by another user
                    ------------------------------------------------------------
                    seat_id := v_seat;
                    success := false;
                    reason := 'locked_by_other';
                    expires_at := NULL;

                    RETURN NEXT;

                END IF;

        END;

    END LOOP;

END;
$$;

-- 4. RPC: release_seat_locks
CREATE OR REPLACE FUNCTION public.release_seat_locks(
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

-- 5. RPC: cleanup_showtime_if_ended (lazy)
CREATE OR REPLACE FUNCTION public.cleanup_showtime_if_ended(p_showtime_id uuid)
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
    DELETE FROM public.seat_locks WHERE showtime_id = p_showtime_id;
  END IF;

  -- Always purge expired locks for this showtime
  DELETE FROM public.seat_locks
   WHERE showtime_id = p_showtime_id AND expires_at < now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.acquire_seat_locks(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_seat_locks(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_showtime_if_ended(uuid) TO authenticated, anon;

-- 6. Realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.seat_locks;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.booked_seats;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

ALTER TABLE public.seat_locks REPLICA IDENTITY FULL;
ALTER TABLE public.booked_seats REPLICA IDENTITY FULL;
