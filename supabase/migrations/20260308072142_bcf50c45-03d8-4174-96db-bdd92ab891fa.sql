ALTER TABLE public.movies 
  ADD COLUMN IF NOT EXISTS budget bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tagline text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS original_language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS production_companies text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tmdb_id integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS popularity numeric DEFAULT 0;