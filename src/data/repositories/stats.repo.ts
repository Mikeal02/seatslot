import { supabase } from '@/integrations/supabase/client';
import { unwrapCount } from '@/data/core/query';

export interface PlatformCounts {
  movies: number;
  bookings: number;
  theatres: number;
}

const SCOPE = 'stats';

export const statsRepository = {
  async platformCounts(): Promise<PlatformCounts> {
    const [movies, bookings, theatres] = await Promise.all([
      unwrapCount(SCOPE, supabase.from('movies').select('id', { count: 'exact', head: true })),
      unwrapCount(SCOPE, supabase.from('bookings').select('id', { count: 'exact', head: true })),
      unwrapCount(SCOPE, supabase.from('theatres').select('id', { count: 'exact', head: true })),
    ]);
    return { movies, bookings, theatres };
  },
};
