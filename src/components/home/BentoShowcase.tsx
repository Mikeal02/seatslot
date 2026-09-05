import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { MouseEvent, useEffect, useMemo, useState } from 'react';
import { Play, ArrowUpRight, Clapperboard, Ticket, Star, Sparkles } from 'lucide-react';
import { Movie } from '@/types/database';
import { Button } from '@/components/ui/button';

interface BentoShowcaseProps {
  featured: Movie;
  movies: Movie[];
}

const SLIDE_MS = 7000;

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

const tile = 'tile-elite tile-elite-lift overflow-hidden';

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 26, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export function BentoShowcase({ featured, movies }: BentoShowcaseProps) {
  const navigate = useNavigate();

  // Rotating hero deck — featured first, then the rest of the window
  const deck = useMemo(() => {
    const rest = movies.filter((m) => m.id !== featured.id);
    return [featured, ...rest].slice(0, 5);
  }, [featured, movies]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => setIndex(0), [deck.length, featured.id]);

  useEffect(() => {
    if (paused || deck.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % deck.length), SLIDE_MS);
    return () => clearInterval(t);
  }, [paused, deck.length]);

  const active = deck[index] ?? featured;
  const trending = movies.filter((m) => m.id !== featured.id).slice(0, 2);
  const runtime = fmtRuntime(active.duration_minutes);
  const heroImage = active.backdrop_url || active.poster_url || null;

  // Subtle cursor parallax on the hero artwork
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 90, damping: 20, mass: 0.5 });
  const sy = useSpring(py, { stiffness: 90, damping: 20, mass: 0.5 });
  const imgX = useTransform(sx, [-0.5, 0.5], ['-1.6%', '1.6%']);
  const imgY = useTransform(sy, [-0.5, 0.5], ['-1.6%', '1.6%']);

  const onHeroMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onHeroLeave = () => {
    px.set(0);
    py.set(0);
    setPaused(false);
  };

  return (
    <section className="container mx-auto px-4 pt-6 pb-12 sm:pt-10">
      {/* Full-width cinematic hero */}
      <motion.div
        {...reveal(0)}
        onMouseMove={onHeroMove}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={onHeroLeave}
        className={`${tile} sheen group relative mb-4 min-h-[460px] w-full md:mb-5 md:min-h-[560px]`}
      >
        <AnimatePresence mode="sync">
          {heroImage && (
            <motion.img
              key={heroImage}
              src={heroImage}
              alt={`${active.title} backdrop`}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.62, scale: 1.02 }}
              exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 1.1 }, scale: { duration: 9, ease: 'linear' } }}
              style={{ x: imgX, y: imgY, top: '-3%', left: '-3%' }}
              className="absolute h-[106%] w-[106%] object-cover object-center"
              loading="eager"
              decoding="async"
            />
          )}
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/25 to-transparent" />
        {/* Cinematic vignette + film grain */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 30% 45%, transparent 35%, hsl(var(--background) / 0.75) 100%)',
          }}
        />
        <div aria-hidden className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.35]" />
        {/* Ember light-leak */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full blur-[110px]"
          style={{ background: 'hsl(var(--primary) / 0.22)' }}
          animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.08, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        {/* Rectangular poster */}
        {active.poster_url && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`poster-${active.id}`}
              initial={{ opacity: 0, x: 34, rotate: 0 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              exit={{ opacity: 0, x: -22, rotate: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className="group/poster absolute right-10 top-8 z-[1] hidden aspect-[2/3] w-[190px] overflow-hidden rounded-2xl border border-foreground/15 shadow-2xl shadow-black/50 md:block lg:right-14 lg:top-10 lg:w-[230px]"
            >
              <img
                src={active.poster_url}
                alt={`${active.title} poster`}
                className="h-full w-full object-cover transition-transform duration-700 group-hover/poster:scale-[1.05]"
                loading="eager"
                decoding="async"
              />
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-foreground/10" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-foreground/5 to-foreground/15" />
              {active.rating ? (
                <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-foreground/15 bg-background/70 px-2.5 py-1 text-[11px] font-bold text-accent backdrop-blur-md tabular">
                  <Star className="h-3 w-3 fill-current" />
                  {Number(active.rating).toFixed(1)}
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        )}

        <div className="relative z-[1] flex h-full flex-col justify-end p-7 sm:p-10 md:p-14 md:pr-[280px] lg:pr-[330px]">

          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full cinema-gradient px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground">
                  Premiere
                </span>
                <span className="meta-caps">In theatres {fmtDate(active.release_date)}</span>
                {active.rating ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/40 px-2.5 py-1 text-xs font-bold text-accent backdrop-blur-md tabular">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {Number(active.rating).toFixed(1)}
                  </span>
                ) : null}
              </div>

              <h1 className="display-tight mb-4 max-w-[15ch] text-[2.75rem] font-extrabold sm:text-6xl md:text-[4.75rem]">
                {active.title}
              </h1>

              {active.description && (
                <p className="mb-6 hidden max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground sm:block">
                  {active.description.slice(0, 190)}
                  {active.description.length > 190 ? '…' : ''}
                </p>
              )}

              <div className="mb-7 flex flex-wrap items-center gap-2.5 meta-caps">
                {runtime && <span>{runtime}</span>}
                {runtime && active.genre?.length ? <span className="opacity-30">/</span> : null}
                <span>{active.genre?.slice(0, 3).join('  ·  ')}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  className="h-14 rounded-2xl px-8 text-sm font-bold tracking-wide shadow-xl shadow-primary/20"
                  onClick={() => navigate(`/movie/${active.id}`)}
                >
                  <Ticket className="mr-2 h-5 w-5" />
                  Book Now
                </Button>
                <button
                  onClick={() => navigate(`/movie/${active.id}?trailer=1`)}
                  aria-label="Watch trailer"
                  className="focus-ring flex h-14 items-center gap-2.5 rounded-2xl border border-border/50 bg-foreground/[0.06] px-5 backdrop-blur-xl transition-colors hover:bg-foreground/[0.12]"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span className="text-sm font-semibold">Trailer</span>
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Slide indicators */}
          {deck.length > 1 && (
            <div className="mt-8 flex items-center gap-2">
              {deck.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Show ${m.title}`}
                  aria-current={i === index}
                  className="focus-ring group/dot h-1.5 overflow-hidden rounded-full bg-foreground/20 transition-all duration-500"
                  style={{ width: i === index ? 56 : 20 }}
                >
                  {i === index && (
                    <motion.span
                      key={`${m.id}-${paused}`}
                      className="block h-full cinema-gradient"
                      initial={{ width: '0%' }}
                      animate={{ width: paused ? '35%' : '100%' }}
                      transition={{ duration: paused ? 0.3 : SLIDE_MS / 1000, ease: 'linear' }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
        {/* Quick booking tile */}
        <motion.div
          {...reveal(0.08)}
          className={`${tile} md:col-span-4 flex flex-col justify-between p-7 sm:p-8`}
        >
          <div className="space-y-1.5">
            <p className="eyebrow">Fast lane</p>
            <h3 className="display-tight text-xl font-bold">Quick Booking</h3>
            <p className="text-sm text-muted-foreground">Jump straight into today's top shows</p>
          </div>
          <div className="mt-6 space-y-2.5">
            {movies.slice(0, 2).map((m) => (
              <Link
                key={m.id}
                to={`/movie/${m.id}`}
                className="focus-ring group/q flex items-center justify-between rounded-xl border border-border/40 bg-background/50 px-4 py-3 transition-all hover:border-primary/40 hover:bg-background"
              >
                <span className="truncate pr-3 text-sm font-medium">{m.title}</span>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-primary">
                  Book
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover/q:-translate-y-0.5 group-hover/q:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Genre explorer tile */}
        <motion.button
          {...reveal(0.14)}
          onClick={() => navigate('/movies')}
          className="group sheen relative isolate flex min-h-[220px] flex-col justify-between overflow-hidden rounded-[2rem] cinema-gradient p-7 text-left focus-ring sm:p-8 md:col-span-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/90 shadow-lg">
              <Clapperboard className="h-6 w-6 text-foreground" />
            </div>
            <ArrowUpRight className="h-6 w-6 text-primary-foreground/70 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
          </div>
          <div className="mt-8">
            <h3 className="display-tight text-[1.65rem] font-extrabold text-primary-foreground">
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
            {...reveal(0.2 + i * 0.07)}
            className={`${tile} md:col-span-2 group min-h-[230px]`}
          >
            <Link to={`/movie/${m.id}`} className="focus-ring block h-full">
              {(m.backdrop_url || m.poster_url) && (
                <img
                  src={m.backdrop_url || m.poster_url || ''}
                  alt={m.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-40 transition-all duration-[900ms] ease-out group-hover:scale-[1.07] group-hover:opacity-60"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6">
                <p className="meta-caps mb-1.5 text-accent">Trending #{i + 1}</p>
                <h4 className="display-tight text-lg font-bold">{m.title}</h4>
              </div>
            </Link>
          </motion.div>
        ))}

        {/* Membership tile */}
        <motion.div
          {...reveal(0.32)}
          className={`${tile} md:col-span-12 flex flex-wrap items-center justify-between gap-5 p-7 sm:p-8`}
        >
          <div className="min-w-[220px] max-w-[60%]">
            <p className="eyebrow mb-2">Membership</p>
            <h3 className="display-tight mb-2 text-2xl font-bold">
              CineBook <span className="cinema-gradient-text">Plus+</span>
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
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
