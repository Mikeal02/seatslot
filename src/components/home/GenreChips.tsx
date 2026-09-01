import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ChevronRight } from "lucide-react";

const GENRES = [
  { name: "Action", emoji: "💥" },
  { name: "Comedy", emoji: "😂" },
  { name: "Drama", emoji: "🎭" },
  { name: "Horror", emoji: "👻" },
  { name: "Romance", emoji: "💕" },
  { name: "Sci-Fi", emoji: "🚀" },
  { name: "Thriller", emoji: "🔪" },
  { name: "Animation", emoji: "✨" },
  { name: "Adventure", emoji: "🗺️" },
  { name: "Fantasy", emoji: "🧙" },
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
          className="mb-6 flex items-end justify-between gap-4"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl cinema-gradient shadow-md shadow-primary/20">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="eyebrow">Browse</p>
              <h3 className="display-tight text-base font-bold">By Genre</h3>
            </div>
          </div>
          <div className="divider-soft hidden flex-1 sm:block" />
        </motion.div>

        <motion.div
          className="scrollbar-hide -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-2"
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
              className="focus-ring group relative shrink-0 overflow-hidden whitespace-nowrap rounded-full border border-border/40 bg-card/70 px-5 py-2.5 backdrop-blur-md transition-colors duration-300 hover:border-primary/40"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {hoveredGenre === genre.name && (
                <motion.span
                  className="absolute inset-0 cinema-gradient opacity-[0.12]"
                  layoutId="genre-hover"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <span className="text-[0.8125rem] font-semibold tracking-wide text-foreground/90 transition-colors group-hover:text-foreground">
                  {genre.name}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
              </span>
            </motion.button>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
