import { motion } from "framer-motion";
import { Film, TrendingUp, Sparkles } from "lucide-react";
import { MovieCard } from "./MovieCard";
import { Movie } from "@/types/database";
import { KineticCounter } from "@/components/effects/KineticCounter";

interface MovieGridProps {
  movies: Movie[];
  title: string;
  subtitle?: string;
}

export function MovieGrid({ movies, title, subtitle }: MovieGridProps) {
  if (movies.length === 0) {
    return null;
  }

  const isNowShowing = title.toLowerCase().includes("now");

  return (
    <section className="py-16 sm:py-24 relative">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/[0.02] blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/[0.02] blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 relative">
        <motion.div
          className="mb-10 sm:mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="section-header-icon shrink-0">
                {isNowShowing ? <Film /> : <TrendingUp />}
              </div>
              <div>
                <p className="eyebrow mb-1.5">
                  {isNowShowing ? "In theatres" : "Coming up"}
                </p>
                <h2 className="display-tight text-[1.75rem] font-extrabold sm:text-4xl">
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="tabular flex items-center gap-1.5 rounded-full border border-border/40 bg-background/50 px-3.5 py-1.5 text-[11px] font-semibold text-muted-foreground backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-primary" />
              <KineticCounter
                to={movies.length}
                className="cinema-gradient-text font-bold"
              />
              <span>{isNowShowing ? "showing" : "upcoming"}</span>
            </div>
          </div>

          <div className="divider-soft mt-7" />
        </motion.div>


        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
          {movies.map((movie, index) => (
            <MovieCard key={movie.id} movie={movie} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
