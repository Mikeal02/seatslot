
DROP VIEW IF EXISTS public.reviews_public;

-- Use a SECURITY DEFINER function to expose sanitized reviews safely
CREATE OR REPLACE FUNCTION public.get_movie_reviews(p_movie_id uuid)
RETURNS TABLE (
  id uuid,
  movie_id uuid,
  rating integer,
  review_text text,
  created_at timestamptz,
  author_name text,
  is_mine boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.movie_id,
    r.rating,
    r.review_text,
    r.created_at,
    COALESCE(p.full_name, 'Anonymous') AS author_name,
    (auth.uid() IS NOT NULL AND r.user_id = auth.uid()) AS is_mine
  FROM public.reviews r
  LEFT JOIN public.profiles p ON p.user_id = r.user_id
  WHERE r.movie_id = p_movie_id
  ORDER BY r.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_movie_reviews(uuid) TO anon, authenticated;
