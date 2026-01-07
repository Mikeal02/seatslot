-- Drop restrictive policies and recreate as permissive for bookings and booked_seats

-- BOOKINGS: Drop all existing policies
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;

-- BOOKINGS: Create permissive policies
CREATE POLICY "Users can view own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- BOOKED_SEATS: Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view booked seats" ON public.booked_seats;
DROP POLICY IF EXISTS "Users can create booked seats" ON public.booked_seats;

-- BOOKED_SEATS: Create permissive policies
CREATE POLICY "Anyone can view booked seats"
ON public.booked_seats
FOR SELECT
USING (true);

CREATE POLICY "Users can create booked seats"
ON public.booked_seats
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booked_seats.booking_id
    AND bookings.user_id = auth.uid()
  )
);

-- MOVIES: Allow any authenticated user to insert/update movies (for TMDB sync)
DROP POLICY IF EXISTS "Anyone can insert movies for sync" ON public.movies;
DROP POLICY IF EXISTS "Anyone can update movies for sync" ON public.movies;

CREATE POLICY "Anyone can insert movies for sync"
ON public.movies
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update movies for sync"
ON public.movies
FOR UPDATE
TO authenticated
USING (true);