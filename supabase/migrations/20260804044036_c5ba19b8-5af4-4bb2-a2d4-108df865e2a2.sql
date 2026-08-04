CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_showtime uuid;
  v_start timestamptz;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT b.showtime_id INTO v_showtime
  FROM public.bookings b
  WHERE b.id = p_booking_id
    AND b.user_id = v_user
    AND b.booking_status = 'confirmed';

  IF v_showtime IS NULL THEN
    RAISE EXCEPTION 'Booking not found or already cancelled';
  END IF;

  SELECT (s.show_date + s.show_time) INTO v_start
  FROM public.showtimes s WHERE s.id = v_showtime;

  IF v_start IS NOT NULL AND v_start < now() THEN
    RAISE EXCEPTION 'Cannot cancel a show that has already started';
  END IF;

  UPDATE public.bookings SET booking_status = 'cancelled' WHERE id = p_booking_id;
  DELETE FROM public.booked_seats WHERE booking_id = p_booking_id;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_booking(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid) TO authenticated;

-- Loyalty record is now provisioned by the signup trigger, not the client
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');

  INSERT INTO public.loyalty_points (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

INSERT INTO public.loyalty_points (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;