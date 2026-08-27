import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Play, ArrowUpRight, Clapperboard, Ticket, Star, Sparkles } from 'lucide-react';
import { Movie } from '@/types/database';
import { Button } from '@/components/ui/button';

interface BentoShowcaseProps {
  featured: Movie;
  movies: Movie[];
}

const fmtRuntime = (mins?: number | null) => {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtDate = (d?: string | null) => {
  if (!d) return 'Now Showing';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
};

const tile =
  'relative overflow-hidden rounded-[2rem] bg-card border border-border/40 shadow-[var(--shadow-md,0_10px_40px_-24px_rgba(0,0,0,0.6))]';

export function BentoShowcase({ featured, movies }: BentoShowcaseProps) {
  const navigate = useNavigate();
  const trending = movies.filter((m) => m.id !== featured.id).slice(0, 2);
  const runtime = fmtRuntime(featured.duration_minutes);

  return (
    <section className="container mx-auto px-4 pt-6 pb-10 sm:pt-10">
      <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-6 gap-4 md:h-[820px]">
        {/* Hero tile */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className={`${tile} md:col-span-8 md:row-span-4 group min-h-[420px]`}
        >
          {featured.backdrop_url && (
            <img
              src={featured.backdrop_url}
              alt={`${featured.title} backdrop`}
              className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]"
              loading="eager"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

          <div className="relative flex h-full flex-col justify-end p-7 sm:p-10 md:p-12">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full cinema-gradient px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-foreground">
                Premiere
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                In theatres {fmtDate(featured.release_date)}
              </span>
              {featured.rating ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {Number(featured.rating).toFixed(1)}
                </span>
              ) : null}
            </div>

            <h1 className="mb-4 max-w-[14ch] text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              {featured.title}
            </h1>

            {featured.description && (
              <p className="mb-6 hidden max-w-xl text-sm leading-relaxed text-muted-foreground sm:block">
                {featured.description.slice(0, 180)}
                {featured.description.length > 180 ? '…' : ''}
              </p>
            )}

            <div className="mb-6 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {runtime && <span>{runtime}</span>}
              {runtime && featured.genre?.length ? <span className="opacity-40">•</span> : null}
              <span>{featured.genre?.slice(0, 3).join(' · ')}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="h-14 rounded-2xl px-8 text-sm font-bold shadow-xl shadow-primary/20"
                onClick={() => navigate(`/movies/${featured.id}`)}
              >
                <Ticket className="mr-2 h-5 w-5" />
                Book Now
              </Button>
              <button
                onClick={() => navigate(`/movies/${featured.id}?trailer=1`)}
                aria-label="Watch trailer"
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/50 bg-foreground/5 backdrop-blur-xl transition-colors hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Play className="h-5 w-5 fill-current" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Quick booking tile */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className={`${tile} md:col-span-4 md:row-span-2 flex flex-col justify-between p-7 sm:p-8`}
        >
          <div className="space-y-1">
            <h3 className="text-lg font-bold tracking-tight">Quick Booking</h3>
            <p className="text-sm text-muted-foreground">Jump straight into today's top shows</p>
          </div>
          <div className="mt-5 space-y-2.5">
            {movies.slice(0, 2).map((m) => (
              <Link
                key={m.id}
                to={`/movies/${m.id}`}
                className="flex items-center justify-between rounded-xl border border-border/40 bg-background/60 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-background"
              >
                <span className="truncate pr-3 text-sm font-medium">{m.title}</span>
                <span className="shrink-0 text-xs font-bold text-primary">Book</span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Genre explorer tile */}
        <motion.button
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.14 }}
          onClick={() => navigate('/movies')}
          className="group md:col-span-4 md:row-span-2 flex flex-col justify-between rounded-[2rem] cinema-gradient p-7 text-left sm:p-8"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/90">
              <Clapperboard className="h-6 w-6 text-foreground" />
            </div>
            <ArrowUpRight className="h-6 w-6 text-primary-foreground/70 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
          </div>
          <div className="mt-8">
            <h3 className="text-2xl font-extrabold leading-tight tracking-tight text-primary-foreground">
              Genre
              <br />
              Explorer
            </h3>
            <p className="mt-2 text-sm font-medium text-primary-foreground/80">
              Browse action, sci-fi, drama and more
            </p>
          </div>
        </motion.button>

        {/* Trending tiles */}
        {trending.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 + i * 0.06 }}
            className={`${tile} md:col-span-3 md:row-span-2 group min-h-[220px]`}
          >
            <Link to={`/movies/${m.id}`} className="block h-full">
              {(m.backdrop_url || m.poster_url) && (
                <img
                  src={m.backdrop_url || m.poster_url || ''}
                  alt={m.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-45 transition-all duration-700 group-hover:scale-105 group-hover:opacity-60"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6">
                <h4 className="text-lg font-bold leading-tight tracking-tight">{m.title}</h4>
                <p className="mt-1 text-xs font-bold text-accent">Trending #{i + 1}</p>
              </div>
            </Link>
          </motion.div>
        ))}

        {/* Membership tile */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className={`${tile} md:col-span-6 md:row-span-2 flex flex-wrap items-center justify-between gap-4 p-7 sm:p-8`}
        >
          <div className="max-w-[60%] min-w-[220px]">
            <h3 className="mb-2 text-2xl font-bold tracking-tight">
              CineBook <span className="cinema-gradient-text">Plus+</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Loyalty points on every booking, premium seating and priority premieres.
            </p>
          </div>
          <Button variant="outline" size="lg" className="rounded-xl" onClick={() => navigate('/profile')}>
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
