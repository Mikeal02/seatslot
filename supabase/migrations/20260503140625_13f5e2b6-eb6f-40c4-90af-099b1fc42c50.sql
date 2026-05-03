CREATE OR REPLACE FUNCTION public.import_movie_from_tmdb(
  p_title text,
  p_description text DEFAULT NULL::text,
  p_poster_url text DEFAULT NULL::text,
  p_backdrop_url text DEFAULT NULL::text,
  p_release_date date DEFAULT NULL::date,
  p_duration_minutes integer DEFAULT 120,
  p_rating numeric DEFAULT NULL::numeric,
  p_genre text[] DEFAULT NULL::text[],
  p_director text DEFAULT NULL::text,
  p_cast_members text[] DEFAULT NULL::text[],
  p_trailer_key text DEFAULT NULL::text,
  p_status text DEFAULT 'now_showing'::text,
  p_tmdb_id integer DEFAULT NULL::integer,
  p_budget bigint DEFAULT 0,
  p_revenue bigint DEFAULT 0,
  p_original_language text DEFAULT 'en'::text,
  p_popularity numeric DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_movie_id UUID;
BEGIN
  IF p_tmdb_id IS NOT NULL THEN
    SELECT id INTO v_movie_id FROM movies WHERE tmdb_id = p_tmdb_id LIMIT 1;
  END IF;

  IF v_movie_id IS NULL THEN
    SELECT id INTO v_movie_id
    FROM movies
    WHERE lower(title) = lower(p_title)
      AND (p_release_date IS NULL OR release_date = p_release_date OR tmdb_id IS NULL)
    ORDER BY CASE WHEN release_date = p_release_date THEN 0 ELSE 1 END, updated_at DESC
    LIMIT 1;
  END IF;
  
  IF v_movie_id IS NOT NULL THEN
    UPDATE movies SET
      tmdb_id = COALESCE(p_tmdb_id, tmdb_id),
      title = p_title,
      description = COALESCE(p_description, description),
      poster_url = COALESCE(p_poster_url, poster_url),
      backdrop_url = COALESCE(p_backdrop_url, backdrop_url),
      release_date = COALESCE(p_release_date, release_date),
      duration_minutes = COALESCE(p_duration_minutes, duration_minutes),
      rating = COALESCE(p_rating, rating),
      genre = COALESCE(p_genre, genre),
      director = COALESCE(p_director, director),
      cast_members = COALESCE(p_cast_members, cast_members),
      trailer_key = COALESCE(p_trailer_key, trailer_key),
      budget = COALESCE(p_budget, budget, 0),
      revenue = COALESCE(p_revenue, revenue, 0),
      original_language = COALESCE(p_original_language, original_language, 'en'),
      popularity = COALESCE(p_popularity, popularity, 0),
      status = p_status,
      updated_at = now()
    WHERE id = v_movie_id;
  ELSE
    INSERT INTO movies (
      tmdb_id, title, description, poster_url, backdrop_url, release_date,
      duration_minutes, rating, genre, director, cast_members, trailer_key,
      budget, revenue, original_language, popularity, status
    ) VALUES (
      p_tmdb_id, p_title, p_description, p_poster_url, p_backdrop_url, p_release_date,
      p_duration_minutes, p_rating, COALESCE(p_genre, '{}'::text[]), p_director, COALESCE(p_cast_members, '{}'::text[]), p_trailer_key,
      COALESCE(p_budget, 0), COALESCE(p_revenue, 0), COALESCE(p_original_language, 'en'), COALESCE(p_popularity, 0), p_status
    )
    RETURNING id INTO v_movie_id;
  END IF;
  
  RETURN v_movie_id;
END;
$function$;