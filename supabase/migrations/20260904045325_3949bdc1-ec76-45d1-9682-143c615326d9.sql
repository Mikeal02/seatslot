CREATE OR REPLACE FUNCTION public.award_loyalty_points(p_amount numeric, p_description text, p_booking_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_pts integer;
  v_amount numeric;
  v_lifetime integer;
  v_tier text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_booking_id IS NULL THEN RAISE EXCEPTION 'Booking is required'; END IF;

  -- Amount is derived server-side from the booking, never trusted from client
  SELECT b.total_amount INTO v_amount
  FROM bookings b
  WHERE b.id = p_booking_id
    AND b.user_id = v_user
    AND b.booking_status = 'confirmed';

  IF v_amount IS NULL THEN
    RAISE EXCEPTION 'Booking not found for user';
  END IF;

  -- Idempotency: a booking can only earn once
  IF EXISTS (
    SELECT 1 FROM points_transactions pt
    WHERE pt.booking_id = p_booking_id
      AND pt.transaction_type = 'earned'
  ) THEN
    RETURN;
  END IF;

  v_pts := floor(v_amount)::int;
  IF v_pts <= 0 THEN RETURN; END IF;

  INSERT INTO loyalty_points (user_id, total_points, lifetime_points, tier)
  VALUES (v_user, v_pts, v_pts, 'bronze')
  ON CONFLICT (user_id) DO UPDATE
    SET total_points = loyalty_points.total_points + v_pts,
        lifetime_points = loyalty_points.lifetime_points + v_pts,
        updated_at = now()
  RETURNING lifetime_points INTO v_lifetime;

  v_tier := CASE
    WHEN v_lifetime >= 5000 THEN 'platinum'
    WHEN v_lifetime >= 2000 THEN 'gold'
    WHEN v_lifetime >= 500 THEN 'silver'
    ELSE 'bronze'
  END;
  UPDATE loyalty_points SET tier = v_tier WHERE user_id = v_user;

  INSERT INTO points_transactions (user_id, points, transaction_type, description, booking_id)
  VALUES (v_user, v_pts, 'earned', COALESCE(p_description, 'Booking reward'), p_booking_id);
END;
$function$;

CREATE UNIQUE INDEX IF NOT EXISTS points_transactions_earned_booking_uniq
  ON public.points_transactions (booking_id)
  WHERE transaction_type = 'earned' AND booking_id IS NOT NULL;

REVOKE EXECUTE ON FUNCTION public.award_loyalty_points(numeric, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_loyalty_points(numeric, text, uuid) TO authenticated, service_role;