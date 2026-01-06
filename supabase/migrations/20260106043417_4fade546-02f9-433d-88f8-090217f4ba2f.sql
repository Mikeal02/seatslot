-- Fix RLS policies for bookings and booked_seats
-- Drop existing restrictive policies and recreate as permissive

-- Drop existing policies on bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;

-- Recreate as permissive policies
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

-- Drop existing policies on booked_seats
DROP POLICY IF EXISTS "Anyone can view booked seats" ON public.booked_seats;
DROP POLICY IF EXISTS "Users can create booked seats" ON public.booked_seats;

-- Recreate as permissive policies
CREATE POLICY "Anyone can view booked seats" 
ON public.booked_seats 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create booked seats" 
ON public.booked_seats 
FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.bookings
  WHERE bookings.id = booked_seats.booking_id
  AND bookings.user_id = auth.uid()
));