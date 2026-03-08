import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, Film } from 'lucide-react';
import { Movie } from '@/types/database';

interface TMDBSimilarMovie {
  tmdb_id: number;
  title: string;
  description: string;
  poster_url: string | null;
  backdrop_url: string | null;
  release_date: string;
  rating: number;
}

interface SimilarMoviesProps {
  movieTitle: string;
  tmdbId?: number | null;
}

export function SimilarMovies({ movieTitle, tmdbId }: SimilarMoviesProps) {
  const [movies, setMovies] = useState<TMDBSimilarMovie[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSimilar = useCallback(async () => {
    if (!tmdbId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-movies?action=details&movie_id=${tmdbId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      if (!res.ok) return;
      const data = await res.json();
      setMovies(data.similar_movies || []);
    } catch (err) {
      console.error('Error fetching similar movies:', err);
    } finally {
      setLoading(false);
    }
  }, [tmdbId]);

  useEffect(() => {
    fetchSimilar();
  }, [fetchSimilar]);

  if (loading || movies.length === 0) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg cinema-gradient flex items-center justify-center">
          <Film className="h-4 w-4 text-primary-foreground" />
        </div>
        <h3 className="text-lg font-bold tracking-tight">Similar Movies</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {movies.slice(0, 8).map((m, i) => (
          <motion.div
            key={m.tmdb_id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="group rounded-xl overflow-hidden bg-card border border-border/30 hover:border-primary/20 transition-all duration-300 glow-card">
              <div className="relative aspect-[2/3] overflow-hidden">
                <img
                  src={m.poster_url || '/placeholder.svg'}
                  alt={m.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
                {m.rating > 0 && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-card/90 backdrop-blur-xl px-2 py-0.5 rounded-full text-[10px] font-bold border border-border/20">
                    <Star className="h-2.5 w-2.5 fill-accent text-accent" />
                    {m.rating}
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <h4 className="text-xs font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                  {m.title}
                </h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {m.release_date?.split('-')[0] || 'TBA'}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
