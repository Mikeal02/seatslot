import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Film, User, Star, X, TrendingUp, Loader2, Flame, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface MovieResult {
  type: 'movie';
  tmdb_id: number;
  title: string;
  poster_url: string | null;
  release_date: string | null;
  rating: number;
  popularity: number;
  overview: string;
}

interface PersonResult {
  type: 'person';
  tmdb_id: number;
  name: string;
  photo: string | null;
  known_for_department: string;
  popularity: number;
  known_for: string[];
}

interface TrendingData {
  movies: MovieResult[];
  people: PersonResult[];
}

interface GlobalSearchProps {
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
}

export function GlobalSearch({ variant = 'desktop', onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState<MovieResult[]>([]);
  const [people, setPeople] = useState<PersonResult[]>([]);
  const [trending, setTrending] = useState<TrendingData | null>(null);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [localMovieMap, setLocalMovieMap] = useState<Record<number, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    if (variant !== 'desktop') return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [variant]);

  // Fetch trending on first focus
  const fetchTrending = useCallback(async () => {
    if (trending || trendingLoading) return;
    setTrendingLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-movies?action=trending&window=day&page=1`,
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      if (!res.ok) throw new Error('Trending failed');
      const data = await res.json();
      const trendingMovies: MovieResult[] = (data.movies || []).slice(0, 5).map((m: any) => ({
        type: 'movie' as const,
        tmdb_id: m.tmdb_id,
        title: m.title,
        poster_url: m.poster_url,
        release_date: m.release_date,
        rating: m.rating,
        popularity: m.popularity,
        overview: (m.description || '').slice(0, 120),
      }));
      setTrending({ movies: trendingMovies, people: [] });
    } catch (err) {
      console.error('Trending error:', err);
    } finally {
      setTrendingLoading(false);
    }
  }, [trending, trendingLoading]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setMovies([]);
      setPeople([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-movies?action=multi_search&query=${encodeURIComponent(q)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setMovies(data.movies || []);
      setPeople(data.people || []);

      const tmdbIds = (data.movies || []).map((m: MovieResult) => m.tmdb_id);
      if (tmdbIds.length > 0) {
        const { data: localMovies } = await supabase
          .from('movies')
          .select('id, tmdb_id')
          .in('tmdb_id', tmdbIds);
        if (localMovies) {
          const map: Record<number, string> = {};
          localMovies.forEach((m) => { if (m.tmdb_id) map[m.tmdb_id] = m.id; });
          setLocalMovieMap(map);
        }
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const handleFocus = () => {
    setOpen(true);
    fetchTrending();
  };

  const goToMovie = (m: MovieResult) => {
    setOpen(false);
    setQuery('');
    const localId = localMovieMap[m.tmdb_id];
    if (localId) {
      navigate(`/movie/${localId}`);
    } else {
      navigate(`/movies?search=${encodeURIComponent(m.title)}`);
    }
    onNavigate?.();
  };

  const goToPerson = (p: PersonResult) => {
    setOpen(false);
    setQuery('');
    navigate(`/person/${p.tmdb_id}`);
    onNavigate?.();
  };

  const hasResults = movies.length > 0 || people.length > 0;
  const showDropdown = open && (query.length >= 2 || (query.length === 0 && trending));
  const showTrending = open && query.length < 2 && trending && trending.movies.length > 0;

  const isMobile = variant === 'mobile';

  return (
    <div ref={containerRef} className={`relative ${isMobile ? 'w-full' : ''}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          placeholder="Search movies & actors..."
          className={`pl-9 pr-16 h-9 rounded-full bg-muted/50 border-border/30 focus-visible:ring-primary/30 text-sm ${
            isMobile ? 'w-full' : 'w-44 sm:w-56 md:w-72'
          }`}
        />
        <div className="absolute right-2 flex items-center gap-1">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          {query && !loading && (
            <button onClick={() => { setQuery(''); setMovies([]); setPeople([]); }} className="p-0.5 rounded-full hover:bg-muted">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          {!isMobile && (
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border/40 bg-muted/60 px-1.5 text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-border/40 bg-popover shadow-2xl shadow-background/80 z-50 ${
              isMobile ? 'left-0 right-0' : 'right-0 w-[360px] sm:w-[420px]'
            }`}
          >
            {/* Trending suggestions (when empty) */}
            {showTrending && (
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-2">
                  <Flame className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Trending Today</span>
                </div>
                {trending!.movies.map((m, i) => (
                  <motion.button
                    key={m.tmdb_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => goToMovie(m)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg cinema-gradient flex items-center justify-center text-primary-foreground text-xs font-black shrink-0">
                      {i + 1}
                    </div>
                    <div className="w-9 h-[52px] rounded-md overflow-hidden bg-muted shrink-0 border border-border/20">
                      {m.poster_url ? (
                        <img src={m.poster_url} alt={m.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Film className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">{m.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {m.release_date && (
                          <span className="text-[11px] text-muted-foreground">{m.release_date.split('-')[0]}</span>
                        )}
                        {m.rating > 0 && (
                          <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                            <Star className="h-2.5 w-2.5 fill-accent text-accent" />
                            {m.rating}
                          </span>
                        )}
                      </div>
                    </div>
                    <TrendingUp className="h-3.5 w-3.5 text-destructive/50 shrink-0" />
                  </motion.button>
                ))}

                {/* Quick links */}
                <div className="mt-2 px-3 pb-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Quick Links</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi'].map((genre) => (
                      <button
                        key={genre}
                        onClick={() => { handleChange(genre); }}
                        className="px-2.5 py-1 rounded-full bg-muted/80 border border-border/30 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Search results */}
            {query.length >= 2 && (
              <>
                {!hasResults && !loading && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No results for "{query}"
                  </div>
                )}

                {movies.length > 0 && (
                  <div className="p-2">
                    <div className="flex items-center gap-2 px-3 py-2">
                      <Film className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Movies</span>
                    </div>
                    {movies.map((m) => (
                      <button
                        key={m.tmdb_id}
                        onClick={() => goToMovie(m)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                      >
                        <div className="w-10 h-14 rounded-md overflow-hidden bg-muted shrink-0 border border-border/20">
                          {m.poster_url ? (
                            <img src={m.poster_url} alt={m.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Film className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">{m.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {m.release_date && (
                              <span className="text-[11px] text-muted-foreground">{m.release_date.split('-')[0]}</span>
                            )}
                            {m.rating > 0 && (
                              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                                <Star className="h-2.5 w-2.5 fill-accent text-accent" />
                                {m.rating}
                              </span>
                            )}
                          </div>
                          {m.overview && (
                            <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{m.overview}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {movies.length > 0 && people.length > 0 && (
                  <div className="mx-3 h-px bg-border/30" />
                )}

                {people.length > 0 && (
                  <div className="p-2">
                    <div className="flex items-center gap-2 px-3 py-2">
                      <User className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">People</span>
                    </div>
                    {people.map((p) => (
                      <button
                        key={p.tmdb_id}
                        onClick={() => goToPerson(p)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0 border border-border/20">
                          {p.photo ? (
                            <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-sm">
                              {p.name[0]}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5">{p.known_for_department}</Badge>
                            {p.known_for.length > 0 && (
                              <span className="text-[10px] text-muted-foreground line-clamp-1">{p.known_for.join(', ')}</span>
                            )}
                          </div>
                        </div>
                        <TrendingUp className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Footer */}
            <div className="px-3 py-2 border-t border-border/20 bg-muted/30">
              <p className="text-[10px] text-muted-foreground text-center">
                Powered by TMDB · Press <kbd className="px-1 py-0.5 rounded border border-border/40 bg-background text-[9px]">Esc</kbd> to close
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
