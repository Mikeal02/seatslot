-- Create app role enum for admin functionality
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create movies table
CREATE TABLE public.movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    poster_url TEXT,
    backdrop_url TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 120,
    rating DECIMAL(3,1) DEFAULT 0,
    genre TEXT[] DEFAULT '{}',
    cast_members TEXT[] DEFAULT '{}',
    director TEXT,
    release_date DATE,
    status TEXT NOT NULL DEFAULT 'coming_soon' CHECK (status IN ('now_showing', 'coming_soon')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create theatres table
CREATE TABLE public.theatres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    city TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create screens table
CREATE TABLE public.screens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theatre_id UUID REFERENCES public.theatres(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    total_rows INTEGER NOT NULL DEFAULT 10,
    seats_per_row INTEGER NOT NULL DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create seats table
CREATE TABLE public.seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    screen_id UUID REFERENCES public.screens(id) ON DELETE CASCADE NOT NULL,
    row_label TEXT NOT NULL,
    seat_number INTEGER NOT NULL,
    seat_type TEXT NOT NULL DEFAULT 'regular' CHECK (seat_type IN ('regular', 'premium', 'vip')),
    price DECIMAL(10,2) NOT NULL DEFAULT 150.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (screen_id, row_label, seat_number)
);

-- Create showtimes table
CREATE TABLE public.showtimes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE NOT NULL,
    screen_id UUID REFERENCES public.screens(id) ON DELETE CASCADE NOT NULL,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    showtime_id UUID REFERENCES public.showtimes(id) ON DELETE CASCADE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    booking_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create booked_seats table
CREATE TABLE public.booked_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    seat_id UUID REFERENCES public.seats(id) ON DELETE CASCADE NOT NULL,
    showtime_id UUID REFERENCES public.showtimes(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (seat_id, showtime_id)
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theatres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showtimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booked_seats ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- Trigger to create profile and role on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_movies_updated_at
  BEFORE UPDATE ON public.movies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles: Only admins can manage, users can view own
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Movies: Anyone can read, admins can manage
CREATE POLICY "Anyone can view movies" ON public.movies
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage movies" ON public.movies
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Theatres: Anyone can read, admins can manage
CREATE POLICY "Anyone can view theatres" ON public.theatres
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage theatres" ON public.theatres
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Screens: Anyone can read, admins can manage
CREATE POLICY "Anyone can view screens" ON public.screens
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage screens" ON public.screens
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Seats: Anyone can read, admins can manage
CREATE POLICY "Anyone can view seats" ON public.seats
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage seats" ON public.seats
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Showtimes: Anyone can read, admins can manage
CREATE POLICY "Anyone can view showtimes" ON public.showtimes
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage showtimes" ON public.showtimes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Bookings: Users can manage own bookings, admins can view all
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Booked seats: Anyone can view (for availability), users can create via bookings
CREATE POLICY "Anyone can view booked seats" ON public.booked_seats
  FOR SELECT USING (true);

CREATE POLICY "Users can create booked seats" ON public.booked_seats
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id AND user_id = auth.uid()
    )
  );

-- Enable realtime for booked_seats (for live seat updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.booked_seats;

-- Insert sample data

-- Sample theatres
INSERT INTO public.theatres (id, name, location, city) VALUES
  ('11111111-1111-1111-1111-111111111111', 'CinePlex Central', '123 Main Street', 'Mumbai'),
  ('22222222-2222-2222-2222-222222222222', 'MovieMax Mall', '456 Park Avenue', 'Delhi'),
  ('33333333-3333-3333-3333-333333333333', 'StarCinema Plaza', '789 Cinema Road', 'Bangalore');

-- Sample screens
INSERT INTO public.screens (id, theatre_id, name, total_rows, seats_per_row) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Screen 1 - IMAX', 12, 20),
  ('aaaa2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Screen 2', 10, 15),
  ('bbbb1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Screen 1 - Dolby', 10, 18),
  ('bbbb2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Screen 2', 8, 12),
  ('cccc1111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Screen 1', 10, 16);

-- Generate seats for Screen 1 (IMAX) - 12 rows, 20 seats each
INSERT INTO public.seats (screen_id, row_label, seat_number, seat_type, price)
SELECT 
  'aaaa1111-1111-1111-1111-111111111111',
  chr(64 + row_num),
  seat_num,
  CASE 
    WHEN row_num <= 3 THEN 'regular'
    WHEN row_num <= 9 THEN 'premium'
    ELSE 'vip'
  END,
  CASE 
    WHEN row_num <= 3 THEN 150.00
    WHEN row_num <= 9 THEN 250.00
    ELSE 400.00
  END
FROM generate_series(1, 12) AS row_num, generate_series(1, 20) AS seat_num;

-- Generate seats for Screen 2 - 10 rows, 15 seats each
INSERT INTO public.seats (screen_id, row_label, seat_number, seat_type, price)
SELECT 
  'aaaa2222-2222-2222-2222-222222222222',
  chr(64 + row_num),
  seat_num,
  CASE 
    WHEN row_num <= 3 THEN 'regular'
    WHEN row_num <= 7 THEN 'premium'
    ELSE 'vip'
  END,
  CASE 
    WHEN row_num <= 3 THEN 120.00
    WHEN row_num <= 7 THEN 200.00
    ELSE 350.00
  END
FROM generate_series(1, 10) AS row_num, generate_series(1, 15) AS seat_num;

-- Sample movies (Now Showing)
INSERT INTO public.movies (title, description, poster_url, backdrop_url, duration_minutes, rating, genre, cast_members, director, release_date, status) VALUES
  ('Dune: Part Three', 'The epic conclusion to the Dune saga. Paul Atreides must navigate treacherous political waters as he leads the Fremen against the Emperor.', 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=500', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200', 165, 9.2, ARRAY['Sci-Fi', 'Action', 'Drama'], ARRAY['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson'], 'Denis Villeneuve', '2024-12-15', 'now_showing'),
  ('The Dark Knight Returns', 'Bruce Wayne comes out of retirement to save Gotham one last time in this thrilling conclusion to the Batman saga.', 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=500', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200', 180, 9.0, ARRAY['Action', 'Thriller', 'Drama'], ARRAY['Christian Bale', 'Anne Hathaway', 'Tom Hardy'], 'Christopher Nolan', '2024-11-20', 'now_showing'),
  ('Avatar: The Last Frontier', 'Jake Sully ventures beyond Pandora to discover new worlds and face an ancient threat that could destroy everything.', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500', 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200', 195, 8.8, ARRAY['Sci-Fi', 'Adventure', 'Fantasy'], ARRAY['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver'], 'James Cameron', '2024-12-01', 'now_showing'),
  ('Inception 2: Dreamscape', 'Dom Cobb returns for one final job that will take him deeper into the dream world than ever before.', 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=500', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200', 150, 8.9, ARRAY['Sci-Fi', 'Thriller', 'Action'], ARRAY['Leonardo DiCaprio', 'Tom Hardy', 'Elliot Page'], 'Christopher Nolan', '2024-11-15', 'now_showing'),
  ('Spider-Man: Final Swing', 'Peter Parker faces his greatest challenge yet as the multiverse collides and every Spider-Man must unite.', 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=500', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200', 155, 8.7, ARRAY['Action', 'Adventure', 'Sci-Fi'], ARRAY['Tom Holland', 'Tobey Maguire', 'Andrew Garfield'], 'Jon Watts', '2024-12-10', 'now_showing'),
  ('The Matrix: Reborn', 'A new chosen one emerges in the Matrix, but this time the machines have evolved beyond anything Neo could have imagined.', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200', 145, 8.5, ARRAY['Sci-Fi', 'Action', 'Thriller'], ARRAY['Keanu Reeves', 'Carrie-Anne Moss', 'Yahya Abdul-Mateen II'], 'Lana Wachowski', '2024-11-25', 'now_showing');

-- Sample movies (Coming Soon)
INSERT INTO public.movies (title, description, poster_url, backdrop_url, duration_minutes, rating, genre, cast_members, director, release_date, status) VALUES
  ('Avengers: Secret Wars', 'The ultimate battle for the multiverse begins as the Avengers face their most powerful enemy yet.', 'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=500', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200', 180, 0, ARRAY['Action', 'Adventure', 'Sci-Fi'], ARRAY['Robert Downey Jr.', 'Chris Evans', 'Scarlett Johansson'], 'Russo Brothers', '2025-05-01', 'coming_soon'),
  ('Interstellar 2', 'Cooper returns from the tesseract with a warning: humanity has only one chance to survive what''s coming.', 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=500', 'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=1200', 175, 0, ARRAY['Sci-Fi', 'Drama', 'Adventure'], ARRAY['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'], 'Christopher Nolan', '2025-03-15', 'coming_soon'),
  ('Jurassic World: Extinction', 'The final chapter of the Jurassic saga. Dinosaurs and humans must coexist or face extinction together.', 'https://images.unsplash.com/photo-1606567595334-d39972c85dfd?w=500', 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=1200', 140, 0, ARRAY['Action', 'Adventure', 'Sci-Fi'], ARRAY['Chris Pratt', 'Bryce Dallas Howard', 'Sam Neill'], 'Colin Trevorrow', '2025-06-20', 'coming_soon'),
  ('Fast & Furious: Final Race', 'Dom Toretto''s crew faces their ultimate challenge in this explosive conclusion to the Fast saga.', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500', 'https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200', 135, 0, ARRAY['Action', 'Thriller', 'Crime'], ARRAY['Vin Diesel', 'Michelle Rodriguez', 'John Cena'], 'Justin Lin', '2025-04-10', 'coming_soon');

-- Sample showtimes for today and next 7 days
INSERT INTO public.showtimes (movie_id, screen_id, show_date, show_time)
SELECT 
  m.id,
  s.id,
  CURRENT_DATE + (day_offset || ' days')::interval,
  time_slot::time
FROM public.movies m
CROSS JOIN public.screens s
CROSS JOIN generate_series(0, 7) AS day_offset
CROSS JOIN (VALUES ('10:00'), ('13:30'), ('17:00'), ('20:30')) AS times(time_slot)
WHERE m.status = 'now_showing'
AND s.id IN ('aaaa1111-1111-1111-1111-111111111111', 'aaaa2222-2222-2222-2222-222222222222')
LIMIT 100;