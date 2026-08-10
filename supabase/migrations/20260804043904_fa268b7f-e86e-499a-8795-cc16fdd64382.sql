-- 1. Payment bypass: block client-side creation of bookings / tickets / snack orders
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create booked seats" ON public.booked_seats;
DROP POLICY IF EXISTS "Users can create order items" ON public.concession_order_items;
DROP POLICY IF EXISTS "Users can create concession orders" ON public.concession_orders;

-- 2. Mass assignment: UPDATE had no WITH CHECK (user could change user_id / total_amount)
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can cancel own bookings"
ON public.bookings FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND booking_status = 'cancelled');

-- 3. Privilege escalation: infinite loyalty points
DROP POLICY IF EXISTS "Users can create own points record" ON public.loyalty_points;
DROP POLICY IF EXISTS "Users can create transactions" ON public.points_transactions;
REVOKE INSERT, UPDATE, DELETE ON public.loyalty_points FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.points_transactions FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.bookings FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.booked_seats FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.concession_orders FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.concession_order_items FROM anon, authenticated;
GRANT ALL ON public.bookings TO service_role;
GRANT ALL ON public.booked_seats TO service_role;
GRANT ALL ON public.concession_orders TO service_role;
GRANT ALL ON public.concession_order_items TO service_role;
GRANT ALL ON public.loyalty_points TO service_role;
GRANT ALL ON public.points_transactions TO service_role;

-- 4. Seat locks leak the holder's user id to every visitor -> column level grants
REVOKE SELECT ON public.seat_locks FROM anon, authenticated;
GRANT SELECT (id, showtime_id, seat_id, locked_at, expires_at) ON public.seat_locks TO anon, authenticated;
GRANT ALL ON public.seat_locks TO service_role;

-- 5. SECURITY DEFINER functions callable by signed-out visitors
REVOKE ALL ON FUNCTION public.generate_showtimes_for_movies() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_showtime_if_ended(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.award_loyalty_points(numeric, text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.redeem_loyalty_points(integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.acquire_seat_locks(uuid, uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.release_seat_locks(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cleanup_showtime_if_ended(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_loyalty_points(numeric, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_loyalty_points(integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_seat_locks(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_seat_locks(uuid, uuid[]) TO authenticated;

-- 6. Idempotency for payment verification (stops replay = duplicate bookings)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_reference text;
CREATE UNIQUE INDEX IF NOT EXISTS bookings_payment_reference_key
  ON public.bookings (payment_reference) WHERE payment_reference IS NOT NULL;