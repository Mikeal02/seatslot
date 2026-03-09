import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Layers, ChevronRight, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CollectionMovie {
  tmdb_id: number;
  title: string;
  poster_url: string | null;
  backdrop_url: string | null;
  release_date: string;
  rating: number;
}

interface CollectionBannerProps {
  collection: {
    id: number;
    name: string;
    poster_url: string | null;
    backdrop_url: string | null;
  };
}

export function CollectionBanner({ collection }: CollectionBannerProps) {
  const [movies, setMovies] = useState<CollectionMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollection();
  }, [collection.id]);

  const fetchCollection = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-movies?action=collection&collection_id=${collection.id}`,
        { headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
      );
      if (!res.ok) return;
      const data = await res.json();
      setMovies(data.movies || []);
    } catch (err) {
      console.error('Error fetching collection:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-border/20 group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
    >
      {/* Background glow */}
      <div className="absolute -inset-1 cinema-gradient opacity-[0.08] blur-2xl rounded-3xl" />

      {/* Backdrop strip - multiple movie backdrops side by side */}
      <div className="relative h-36 sm:h-44 overflow-hidden">
        {movies.length > 0 ? (
          <div className="flex h-full">
            {movies.map((m, i) => (
              <motion.div
                key={m.tmdb_id}
                className="relative flex-1 min-w-0 overflow-hidden"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.6 }}
              >
                <img
                  src={m.backdrop_url || m.poster_url || '/placeholder.svg'}
                  alt={m.title}
                  className="w-full h-full object-cover"
                />
                {/* Divider line between images */}
                {i < movies.length - 1 && (
                  <div className="absolute top-0 right-0 bottom-0 w-px bg-background/40" />
                )}
                {/* Subtle title on hover */}
                <div className="absolute bottom-0 inset-x-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-[9px] font-bold text-foreground/80 line-clamp-1 text-center drop-shadow-lg">
                    {m.title}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <img
            src={collection.backdrop_url || collection.poster_url || '/placeholder.svg'}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-card/30 via-transparent to-card/30" />
        
        {/* Top vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,hsl(var(--card))_100%)] opacity-40" />

        {/* Rating badges on hover */}
        {movies.length > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-1 bg-card/90 backdrop-blur-xl px-2 py-1 rounded-full text-[10px] font-bold border border-border/20">
              <Layers className="h-3 w-3 text-primary" />
              {movies.length} films
            </div>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="relative px-5 pb-5 -mt-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Badge className="cinema-gradient text-primary-foreground text-[10px] font-black px-3 py-1 rounded-full border-0 uppercase tracking-[0.15em] mb-2.5 shadow-lg">
            Part of Collection
          </Badge>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-black text-lg sm:text-xl tracking-tight">{collection.name}</h3>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </motion.div>

        {/* Movie mini posters row */}
        {movies.length > 0 && (
          <motion.div
            className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-thin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {movies.map((m, i) => (
              <motion.div
                key={m.tmdb_id}
                className="shrink-0 w-14 group/poster"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.06 }}
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-border/20 group-hover/poster:border-primary/40 transition-colors">
                  <img
                    src={m.poster_url || '/placeholder.svg'}
                    alt={m.title}
                    className="w-full h-full object-cover"
                  />
                  {m.rating > 0 && (
                    <div className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5 bg-card/90 backdrop-blur px-1 py-0.5 rounded text-[8px] font-bold">
                      <Star className="h-2 w-2 fill-accent text-accent" />
                      {m.rating}
                    </div>
                  )}
                </div>
                <p className="text-[8px] text-muted-foreground text-center mt-1 line-clamp-1 font-medium">
                  {m.release_date?.split('-')[0]}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
