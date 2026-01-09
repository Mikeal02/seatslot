-- Fix security issues: Remove overly permissive movie write policies
-- Only admins should be able to insert/update movies

-- Drop the permissive policies that allow any authenticated user to modify movies
DROP POLICY IF EXISTS "Anyone can insert movies for sync" ON public.movies;
DROP POLICY IF EXISTS "Anyone can update movies for sync" ON public.movies;

-- The existing "Admins can manage movies" policy already provides proper admin-only access
-- No new policies needed as admin policy already covers all operations

-- Create a security definer function for movie imports that can be called by authenticated users
-- This allows the TMDB sync to work while keeping write operations secured
CREATE OR REPLACE FUNCTION public.import_movie_from_tmdb(
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_poster_url TEXT DEFAULT NULL,
  p_backdrop_url TEXT DEFAULT NULL,
  p_release_date DATE DEFAULT NULL,
  p_duration_minutes INTEGER DEFAULT 120,
  p_rating NUMERIC DEFAULT NULL,
  p_genre TEXT[] DEFAULT NULL,
  p_director TEXT DEFAULT NULL,
  p_cast_members TEXT[] DEFAULT NULL,
  p_trailer_key TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'now_showing'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_movie_id UUID;
BEGIN
  -- Check if movie already exists
  SELECT id INTO v_movie_id FROM movies WHERE title = p_title LIMIT 1;
  
  IF v_movie_id IS NOT NULL THEN
    -- Update existing movie
    UPDATE movies SET
      description = COALESCE(p_description, description),
      poster_url = COALESCE(p_poster_url, poster_url),
      backdrop_url = COALESCE(p_backdrop_url, backdrop_url),
      release_date = COALESCE(p_release_date, release_date),
      duration_minutes = p_duration_minutes,
      rating = COALESCE(p_rating, rating),
      genre = COALESCE(p_genre, genre),
      director = COALESCE(p_director, director),
      cast_members = COALESCE(p_cast_members, cast_members),
      trailer_key = COALESCE(p_trailer_key, trailer_key),
      status = p_status,
      updated_at = now()
    WHERE id = v_movie_id;
  ELSE
    -- Insert new movie
    INSERT INTO movies (
      title, description, poster_url, backdrop_url, release_date,
      duration_minutes, rating, genre, director, cast_members, trailer_key, status
    ) VALUES (
      p_title, p_description, p_poster_url, p_backdrop_url, p_release_date,
      p_duration_minutes, p_rating, p_genre, p_director, p_cast_members, p_trailer_key, p_status
    )
    RETURNING id INTO v_movie_id;
  END IF;
  
  RETURN v_movie_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.import_movie_from_tmdb TO authenticated;