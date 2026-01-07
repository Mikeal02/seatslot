-- Add trailer_key column to movies table for storing YouTube trailer keys
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS trailer_key TEXT;