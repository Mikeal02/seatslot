import { supabase } from '@/integrations/supabase/client';
import { isUuid } from '@/lib/movieImport';

const cache = new Set<string>();

/**
 * Warm up the network and image caches for a movie detail page
 * so navigation feels instantaneous. Safe to call repeatedly.
 */
export function prefetchMovie(id: string, posterUrl?: string | null, backdropUrl?: string | null) {
  if (!id || cache.has(id)) return;
  cache.add(id);

  // Preload backdrop (largest paint) + poster
  if (backdropUrl) {
    const img = new Image();
    img.decoding = 'async';
    img.src = backdropUrl;
  }
  if (posterUrl) {
    const img = new Image();
    img.decoding = 'async';
    img.src = posterUrl;
  }

  // Warm Supabase row cache (fire-and-forget)
  try {
    const q = supabase.from('movies').select('*');
    if (isUuid(id)) {
      q.eq('id', id).single().then(() => {});
    } else if (!isNaN(Number(id))) {
      q.eq('tmdb_id', Number(id)).maybeSingle().then(() => {});
    }
  } catch {
    // ignore
  }
}
