
CREATE OR REPLACE FUNCTION public.generate_showtimes_for_movies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_movie RECORD;
  v_screen RECORD;
  v_day INTEGER;
  v_date DATE;
  v_times TEXT[] := ARRAY['10:00', '13:30', '17:00', '20:30'];
  v_time TEXT;
BEGIN
  -- Delete old showtimes (before today)
  DELETE FROM showtimes WHERE show_date < CURRENT_DATE
    AND id NOT IN (SELECT showtime_id FROM booked_seats);

  -- For each movie that has no future showtimes and is released (now showing)
  FOR v_movie IN
    SELECT m.id FROM movies m
    WHERE (m.release_date IS NULL OR m.release_date <= CURRENT_DATE)
    AND NOT EXISTS (
      SELECT 1 FROM showtimes s WHERE s.movie_id = m.id AND s.show_date >= CURRENT_DATE
    )
  LOOP
    FOR v_screen IN SELECT id FROM screens LIMIT 3
    LOOP
      FOR v_day IN 0..6
      LOOP
        v_date := CURRENT_DATE + v_day;
        FOREACH v_time IN ARRAY v_times
        LOOP
          INSERT INTO showtimes (movie_id, screen_id, show_date, show_time)
          VALUES (v_movie.id, v_screen.id, v_date, v_time::time)
          ON CONFLICT DO NOTHING;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;

-- Generate showtimes now
SELECT public.generate_showtimes_for_movies();
