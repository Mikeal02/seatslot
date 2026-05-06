
-- 1. Lock down loyalty_points: remove user UPDATE, add SECURITY DEFINER RPCs
DROP POLICY IF EXISTS "Users can update own points" ON public.loyalty_points;

CREATE OR REPLACE FUNCTION public.award_loyalty_points(
  p_amount numeric,
  p_description text,
  p_booking_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_pts integer;
  v_lifetime integer;
  v_tier text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;

  -- Optional: validate booking belongs to user
  IF p_booking_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM bookings WHERE id = p_booking_id AND user_id = v_user) THEN
      RAISE EXCEPTION 'Booking does not belong to user';
    END IF;
  END IF;

  v_pts := floor(p_amount)::int;

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
  VALUES (v_user, v_pts, 'earned', p_description, p_booking_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_loyalty_points(
  p_points integer,
  p_description text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_current integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_points IS NULL OR p_points <= 0 THEN RAISE EXCEPTION 'Invalid points'; END IF;

  SELECT total_points INTO v_current FROM loyalty_points WHERE user_id = v_user;
  IF v_current IS NULL OR v_current < p_points THEN
    RAISE EXCEPTION 'Insufficient points';
  END IF;

  UPDATE loyalty_points
  SET total_points = total_points - p_points, updated_at = now()
  WHERE user_id = v_user;

  INSERT INTO points_transactions (user_id, points, transaction_type, description)
  VALUES (v_user, -p_points, 'redeemed', p_description);
END;
$$;

-- Make sure loyalty_points has unique user_id for upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'loyalty_points_user_id_key'
  ) THEN
    ALTER TABLE public.loyalty_points ADD CONSTRAINT loyalty_points_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 2. Reviews: hide user_id from public; expose sanitized view
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

CREATE POLICY "Users can view own reviews"
ON public.reviews FOR SELECT
USING (auth.uid() = user_id);

CREATE OR REPLACE VIEW public.reviews_public
WITH (security_invoker = false) AS
SELECT
  r.id,
  r.movie_id,
  r.rating,
  r.review_text,
  r.created_at,
  COALESCE(p.full_name, 'Anonymous') AS author_name
FROM public.reviews r
LEFT JOIN public.profiles p ON p.user_id = r.user_id;

GRANT SELECT ON public.reviews_public TO anon, authenticated;
