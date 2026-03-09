import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Film, Calendar, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TMDBSimilarMovie {
  tmdb_id: number;
  title: string;
  description: string;
  poster_url: string | null;
  backdrop_url: string | null;
  release_date: string;
  rating: number;
  vote_count?: number;
  genre?: string[];
}

interface SimilarMoviesProps {
  movieTitle: string;
  tmdbId?: number | null;
  similarMovies?: TMDBSimilarMovie[];
  recommendedMovies?: TMDBSimilarMovie[];
}

export function SimilarMovies({ movieTitle, tmdbId, similarMovies: propSimilar, recommendedMovies: propRecommended }: SimilarMoviesProps) {
  const [similar, setSimilar] = useState<TMDBSimilarMovie[]>(propSimilar || []);
  const [recommended, setRecommended] = useState<TMDBSimilarMovie[]>(propRecommended || []);
  const [loading, setLoading] = useState(!propSimilar && !propRecommended);
  const [activeTab, setActiveTab] = useState<'similar' | 'recommended'>('similar');

  const fetchData = useCallback(async () => {
    if (propSimilar || propRecommended || !tmdbId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-movies?action=details&movie_id=${tmdbId}`,
        { headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
      );
      if (!res.ok) return;
      const data = await res.json();
      setSimilar(data.similar_movies || []);
      setRecommended(data.recommended_movies || []);
    } catch (err) {
      console.error('Error fetching similar movies:', err);
    } finally {
      setLoading(false);
    }
  }, [tmdbId, propSimilar, propRecommended]);

  useEffect(() => {
    if (propSimilar) setSimilar(propSimilar);
    if (propRecommended) setRecommended(propRecommended);
  }, [propSimilar, propRecommended]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const movies = activeTab === 'similar' ? similar : recommended;
  if (loading || (similar.length === 0 && recommended.length === 0)) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg cinema-gradient flex items-center justify-center">
            <Film className="h-4 w-4 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-bold tracking-tight">Discover More</h3>
        </div>
        <div className="flex gap-1.5 bg-muted/50 p-1 rounded-lg border border-border/30">
          <button
            onClick={() => setActiveTab('similar')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'similar' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Similar ({similar.length})
          </button>
          <button
            onClick={() => setActiveTab('recommended')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'recommended' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Recommended ({recommended.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {movies.slice(0, 10).map((m, i) => (
          <motion.div
            key={`${activeTab}-${m.tmdb_id}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
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
                {/* Genre tags on hover */}
                {m.genre && m.genre.length > 0 && (
                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex flex-wrap gap-1">
                      {m.genre.slice(0, 2).map(g => (
                        <span key={g} className="text-[9px] bg-card/80 backdrop-blur-md px-1.5 py-0.5 rounded-full font-medium border border-border/20">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <h4 className="text-xs font-semibold line-clamp-1 group-hover:text-primary transition-colors">{m.title}</h4>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-muted-foreground">{m.release_date?.split('-')[0] || 'TBA'}</p>
                  {m.vote_count && m.vote_count > 0 && (
                    <p className="text-[9px] text-muted-foreground">{m.vote_count > 1000 ? `${(m.vote_count / 1000).toFixed(1)}K` : m.vote_count} votes</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
