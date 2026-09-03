CREATE UNIQUE INDEX IF NOT EXISTS showtimes_unique_slot
  ON public.showtimes (movie_id, screen_id, show_date, show_time);

CREATE OR REPLACE FUNCTION public.generate_showtimes_for_movie(p_movie_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_screens uuid[];
BEGIN
  SELECT array_agg(id) INTO v_screens FROM (SELECT id FROM screens ORDER BY created_at LIMIT 3) t;
  IF v_screens IS NULL THEN RETURN; END IF;

  INSERT INTO showtimes (movie_id, screen_id, show_date, show_time)
  SELECT m.id, sc, CURRENT_DATE + d, t::time
  FROM movies m
  CROSS JOIN unnest(v_screens) sc
  CROSS JOIN generate_series(0, 6) d
  CROSS JOIN unnest(ARRAY['10:00','13:30','17:00','20:30']) t
  WHERE m.id = p_movie_id
    AND (m.release_date IS NULL OR m.release_date <= CURRENT_DATE)
  ON CONFLICT (movie_id, screen_id, show_date, show_time) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_showtimes_for_movies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_screens uuid[];
BEGIN
  DELETE FROM showtimes s
  WHERE s.show_date < CURRENT_DATE
    AND NOT EXISTS (SELECT 1 FROM booked_seats bs WHERE bs.showtime_id = s.id);

  DELETE FROM seat_locks sl WHERE sl.expires_at < now();

  SELECT array_agg(id) INTO v_screens FROM (SELECT id FROM screens ORDER BY created_at LIMIT 3) t;
  IF v_screens IS NULL THEN RETURN; END IF;

  INSERT INTO showtimes (movie_id, screen_id, show_date, show_time)
  SELECT m.id, sc, CURRENT_DATE + d, t::time
  FROM movies m
  CROSS JOIN unnest(v_screens) sc
  CROSS JOIN generate_series(0, 6) d
  CROSS JOIN unnest(ARRAY['10:00','13:30','17:00','20:30']) t
  WHERE (m.release_date IS NULL OR m.release_date <= CURRENT_DATE)
  ON CONFLICT (movie_id, screen_id, show_date, show_time) DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_showtimes_for_movies() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_showtimes_for_movies() TO service_role, postgres;

REVOKE EXECUTE ON FUNCTION public.generate_showtimes_for_movie(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_showtimes_for_movie(uuid) TO anon, authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.award_loyalty_points(numeric, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_loyalty_points(numeric, text, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.redeem_loyalty_points(integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_loyalty_points(integer, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.cancel_booking(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.acquire_seat_locks(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.acquire_seat_locks(uuid, uuid[]) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.release_seat_locks(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.release_seat_locks(uuid, uuid[]) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
BEGIN
  PERFORM cron.unschedule('nightly-showtime-refresh');
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

SELECT cron.schedule(
  'nightly-showtime-refresh',
  '15 3 * * *',
  $$SELECT public.generate_showtimes_for_movies();$$
);