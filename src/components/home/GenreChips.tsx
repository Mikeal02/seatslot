import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';

const GENRES = [
  { name: 'Action', emoji: '💥' },
  { name: 'Comedy', emoji: '😂' },
  { name: 'Drama', emoji: '🎭' },
  { name: 'Horror', emoji: '👻' },
  { name: 'Romance', emoji: '💕' },
  { name: 'Sci-Fi', emoji: '🚀' },
  { name: 'Thriller', emoji: '🔪' },
  { name: 'Animation', emoji: '✨' },
  { name: 'Adventure', emoji: '🗺️' },
  { name: 'Fantasy', emoji: '🧙' },
];

export function GenreChips() {
  const navigate = useNavigate();
  const [hoveredGenre, setHoveredGenre] = useState<string | null>(null);

  const handleGenreClick = (genre: string) => {
    // Navigate to movies page with genre filter
    navigate(`/movies?genre=${encodeURIComponent(genre)}`);
  };

  return (
    <section className="py-8 sm:py-12 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div className="h-8 w-8 rounded-lg cinema-gradient flex items-center justify-center shadow-md shadow-primary/20">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Browse by Genre</h3>
            <p className="text-xs text-muted-foreground">Find your perfect movie</p>
          </div>
        </motion.div>

        <motion.div 
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {GENRES.map((genre, i) => (
            <motion.button
              key={genre.name}
              onClick={() => handleGenreClick(genre.name)}
              onMouseEnter={() => setHoveredGenre(genre.name)}
              onMouseLeave={() => setHoveredGenre(null)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-full bg-card/80 border border-border/30 hover:border-primary/40 transition-all duration-300 whitespace-nowrap group shrink-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Hover glow */}
              {hoveredGenre === genre.name && (
                <motion.div
                  className="absolute inset-0 rounded-full cinema-gradient opacity-10"
                  layoutId="genre-hover"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              
              <span className="text-base">{genre.emoji}</span>
              <span className="text-sm font-semibold text-foreground/90 group-hover:text-foreground transition-colors">
                {genre.name}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
