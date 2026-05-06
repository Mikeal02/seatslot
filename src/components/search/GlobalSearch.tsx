import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Film, User, Star, X, TrendingUp, Loader2, Flame, Clock, ArrowUp, ArrowDown, CornerDownLeft, Sparkles } from 'lucide-react';
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

interface RecentItem {
  type: 'movie' | 'person';
  id: number;
  label: string;
  image: string | null;
  ts: number;
}

interface GlobalSearchProps {
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
}

const RECENT_KEY = 'cb_recent_searches_v1';
const MAX_RECENT = 6;

// Cache config
const SEARCH_CACHE_KEY = 'cb_search_cache_v1';
const TRENDING_CACHE_KEY = 'cb_trending_cache_v1';
const SEARCH_TTL = 10 * 60 * 1000;
const TRENDING_TTL = 30 * 60 * 1000;
const MAX_CACHE_ENTRIES = 60;

interface SearchPayload {
  movies: MovieResult[];
  people: PersonResult[];
  localMap: Record<number, string>;
}
interface CacheEntry<T> { ts: number; data: T }

const memSearchCache = new Map<string, CacheEntry<SearchPayload>>();
let memTrendingCache: CacheEntry<TrendingData> | null = null;

(function loadPersistedSearchCache() {
  try {
    const raw = localStorage.getItem(SEARCH_CACHE_KEY);
    if (!raw) return;
    const parsed: Record<string, CacheEntry<SearchPayload>> = JSON.parse(raw);
    const now = Date.now();
    Object.entries(parsed).forEach(([k, v]) => {
      if (v && now - v.ts < SEARCH_TTL) memSearchCache.set(k, v);
    });
  } catch {}
})();

function persistSearchCache() {
  try {
    const obj: Record<string, CacheEntry<SearchPayload>> = {};
    memSearchCache.forEach((v, k) => { obj[k] = v; });
    localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(obj));
  } catch {}
}
function setSearchCache(key: string, data: SearchPayload) {
  if (memSearchCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = memSearchCache.keys().next().value;
    if (firstKey) memSearchCache.delete(firstKey);
  }
  memSearchCache.set(key, { ts: Date.now(), data });
  persistSearchCache();
}
function getSearchCache(key: string): SearchPayload | null {
  const hit = memSearchCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > SEARCH_TTL) { memSearchCache.delete(key); return null; }
  memSearchCache.delete(key);
  memSearchCache.set(key, hit);
  return hit.data;
}
function loadPersistedTrending(): TrendingData | null {
  if (memTrendingCache && Date.now() - memTrendingCache.ts < TRENDING_TTL) return memTrendingCache.data;
  try {
    const raw = localStorage.getItem(TRENDING_CACHE_KEY);
    if (!raw) return null;
    const parsed: CacheEntry<TrendingData> = JSON.parse(raw);
    if (Date.now() - parsed.ts > TRENDING_TTL) return null;
    memTrendingCache = parsed;
    return parsed.data;
  } catch { return null; }
}
function setTrendingCache(data: TrendingData) {
  const entry = { ts: Date.now(), data };
  memTrendingCache = entry;
  try { localStorage.setItem(TRENDING_CACHE_KEY, JSON.stringify(entry)); } catch {}
}

const ROTATING_HINTS = [
  'Search "Oppenheimer"',
  'Try "Christopher Nolan"',
  'Find action movies',
  'Explore trending today',
  'Discover by actor',
];

function highlight(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/25 text-primary rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function GlobalSearch({ variant = 'desktop', onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState<MovieResult[]>([]);
  const [people, setPeople] = useState<PersonResult[]>([]);
  const [trending, setTrending] = useState<TrendingData | null>(() => loadPersistedTrending());
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [localMovieMap, setLocalMovieMap] = useState<Record<number, string>>({});
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [hintIdx, setHintIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const reqId = useRef(0);
  const navigate = useNavigate();

  // Load recents
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecents(JSON.parse(raw));
    } catch {}
  }, []);

  const pushRecent = useCallback((item: RecentItem) => {
    setRecents((prev) => {
      const next = [item, ...prev.filter((r) => !(r.type === item.type && r.id === item.id))].slice(0, MAX_RECENT);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const clearRecents = useCallback(() => {
    setRecents([]);
    try { localStorage.removeItem(RECENT_KEY); } catch {}
  }, []);

  // Rotating placeholder hint
  useEffect(() => {
    if (open || query) return;
    const t = setInterval(() => setHintIdx((i) => (i + 1) % ROTATING_HINTS.length), 3500);
    return () => clearInterval(t);
  }, [open, query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cmd/Ctrl+K
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

  const fetchTrending = useCallback(async () => {
    if (trending || trendingLoading) return;
    setTrendingLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-movies?action=trending&window=day&page=1`,
        { headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
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
    if (q.length < 2) { setMovies([]); setPeople([]); return; }
    const myId = ++reqId.current;
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-movies?action=multi_search&query=${encodeURIComponent(q)}`,
        { headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
      );
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      if (myId !== reqId.current) return; // stale
      setMovies(data.movies || []);
      setPeople(data.people || []);

      const tmdbIds = (data.movies || []).map((m: MovieResult) => m.tmdb_id);
      if (tmdbIds.length > 0) {
        const { data: localMovies } = await supabase
          .from('movies').select('id, tmdb_id').in('tmdb_id', tmdbIds);
        if (localMovies && myId === reqId.current) {
          const map: Record<number, string> = {};
          localMovies.forEach((m) => { if (m.tmdb_id) map[m.tmdb_id] = m.id; });
          setLocalMovieMap(map);
        }
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      if (myId === reqId.current) setLoading(false);
    }
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    setOpen(true);
    setActiveIdx(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 220);
  };

  const handleFocus = () => { setOpen(true); fetchTrending(); };

  const goToMovie = (m: MovieResult) => {
    setOpen(false); setQuery('');
    pushRecent({ type: 'movie', id: m.tmdb_id, label: m.title, image: m.poster_url, ts: Date.now() });
    const localId = localMovieMap[m.tmdb_id];
    navigate(localId ? `/movie/${localId}` : `/movie/${m.tmdb_id}`);
    onNavigate?.();
  };

  const goToPerson = (p: PersonResult) => {
    setOpen(false); setQuery('');
    pushRecent({ type: 'person', id: p.tmdb_id, label: p.name, image: p.photo, ts: Date.now() });
    navigate(`/person/${p.tmdb_id}`);
    onNavigate?.();
  };

  const goToRecent = (r: RecentItem) => {
    setOpen(false); setQuery('');
    navigate(r.type === 'movie' ? `/movie/${r.id}` : `/person/${r.id}`);
    onNavigate?.();
  };

  // Flat keyboard nav list
  const flatList = useMemo(() => {
    if (query.length >= 2) {
      return [
        ...movies.map((m) => ({ kind: 'movie' as const, data: m })),
        ...people.map((p) => ({ kind: 'person' as const, data: p })),
      ];
    }
    return [
      ...recents.map((r) => ({ kind: 'recent' as const, data: r })),
      ...(trending?.movies || []).map((m) => ({ kind: 'movie' as const, data: m })),
    ];
  }, [query, movies, people, recents, trending]);

  // Keyboard navigation inside dropdown
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (!flatList.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => (i + 1) % flatList.length); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => (i - 1 + flatList.length) % flatList.length); }
      else if (e.key === 'Enter') {
        const item = flatList[activeIdx];
        if (!item) return;
        e.preventDefault();
        if (item.kind === 'movie') goToMovie(item.data as MovieResult);
        else if (item.kind === 'person') goToPerson(item.data as PersonResult);
        else goToRecent(item.data as RecentItem);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flatList, activeIdx]);

  const hasResults = movies.length > 0 || people.length > 0;
  const showDropdown = open && (query.length >= 2 || (query.length === 0 && (trending || recents.length > 0)));
  const showTrending = open && query.length < 2 && trending && trending.movies.length > 0;
  const showRecents = open && query.length < 2 && recents.length > 0;

  const isMobile = variant === 'mobile';

  // Index helpers for active styling
  let cursor = 0;

  return (
    <div ref={containerRef} className={`relative ${isMobile ? 'w-full' : ''}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={ROTATING_HINTS[hintIdx]}
          className={`pl-9 pr-16 h-9 rounded-full bg-muted/50 border-border/30 focus-visible:ring-primary/30 text-sm transition-all ${
            isMobile ? 'w-full' : 'w-44 sm:w-56 md:w-72 focus-visible:w-72 sm:focus-visible:w-80 md:focus-visible:w-96'
          }`}
        />
        <div className="absolute right-2 flex items-center gap-1">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
          {query && !loading && (
            <button onClick={() => { setQuery(''); setMovies([]); setPeople([]); inputRef.current?.focus(); }} className="p-0.5 rounded-full hover:bg-muted">
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
            transition={{ duration: 0.12 }}
            className={`absolute top-full mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-border/40 bg-popover/95 backdrop-blur-xl shadow-2xl shadow-background/80 z-50 ${
              isMobile ? 'left-0 right-0' : 'right-0 w-[380px] sm:w-[440px]'
            }`}
          >
            {/* Recent searches */}
            {showRecents && (
              <div className="p-2 border-b border-border/20">
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recent</span>
                  </div>
                  <button onClick={clearRecents} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Clear</button>
                </div>
                <div className="flex flex-wrap gap-1.5 px-2 pb-1">
                  {recents.map((r) => {
                    const idx = cursor++;
                    const active = idx === activeIdx;
                    return (
                      <button
                        key={`${r.type}-${r.id}`}
                        onClick={() => goToRecent(r)}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full border transition-all text-[11px] font-medium ${
                          active ? 'bg-primary/15 border-primary/40 text-foreground' : 'bg-muted/60 border-border/30 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {r.image ? (
                          <img src={r.image} alt="" className="w-4 h-4 rounded-full object-cover" />
                        ) : (
                          r.type === 'movie' ? <Film className="h-3 w-3" /> : <User className="h-3 w-3" />
                        )}
                        <span className="line-clamp-1 max-w-[120px]">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Trending */}
            {showTrending && (
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-2">
                  <Flame className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Trending Today</span>
                </div>
                {trending!.movies.map((m, i) => {
                  const idx = cursor++;
                  const active = idx === activeIdx;
                  return (
                    <motion.button
                      key={m.tmdb_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => goToMovie(m)}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left group ${active ? 'bg-accent/60' : 'hover:bg-accent/40'}`}
                    >
                      <div className="w-8 h-8 rounded-lg cinema-gradient flex items-center justify-center text-primary-foreground text-xs font-black shrink-0">{i + 1}</div>
                      <div className="w-9 h-[52px] rounded-md overflow-hidden bg-muted shrink-0 border border-border/20">
                        {m.poster_url ? <img src={m.poster_url} alt={m.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Film className="h-3.5 w-3.5" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">{m.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {m.release_date && <span className="text-[11px] text-muted-foreground">{m.release_date.split('-')[0]}</span>}
                          {m.rating > 0 && <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground"><Star className="h-2.5 w-2.5 fill-accent text-accent" />{m.rating}</span>}
                        </div>
                      </div>
                      <TrendingUp className="h-3.5 w-3.5 text-destructive/50 shrink-0" />
                    </motion.button>
                  );
                })}

                <div className="mt-2 px-3 pb-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Quick Genres
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller'].map((genre) => (
                      <button
                        key={genre}
                        onClick={() => handleChange(genre)}
                        className="px-2.5 py-1 rounded-full bg-muted/80 border border-border/30 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted hover:border-primary/30 transition-all"
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
                  <div className="p-8 text-center">
                    <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-muted-foreground text-sm">No results for "<span className="text-foreground font-medium">{query}</span>"</p>
                    <p className="text-muted-foreground/60 text-[11px] mt-1">Try a different keyword or actor name</p>
                  </div>
                )}

                {movies.length > 0 && (
                  <div className="p-2">
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Film className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Movies</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{movies.length}</span>
                    </div>
                    {movies.map((m) => {
                      const idx = cursor++;
                      const active = idx === activeIdx;
                      return (
                        <button
                          key={m.tmdb_id}
                          onClick={() => goToMovie(m)}
                          onMouseEnter={() => setActiveIdx(idx)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left group ${active ? 'bg-accent/60' : 'hover:bg-accent/40'}`}
                        >
                          <div className="w-10 h-14 rounded-md overflow-hidden bg-muted shrink-0 border border-border/20">
                            {m.poster_url ? <img src={m.poster_url} alt={m.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Film className="h-4 w-4" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">{highlight(m.title, query)}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {m.release_date && <span className="text-[11px] text-muted-foreground">{m.release_date.split('-')[0]}</span>}
                              {m.rating > 0 && <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground"><Star className="h-2.5 w-2.5 fill-accent text-accent" />{m.rating.toFixed(1)}</span>}
                              {localMovieMap[m.tmdb_id] && <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-primary/40 text-primary">In Library</Badge>}
                            </div>
                            {m.overview && <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{m.overview}</p>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {movies.length > 0 && people.length > 0 && <div className="mx-3 h-px bg-border/30" />}

                {people.length > 0 && (
                  <div className="p-2">
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">People</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{people.length}</span>
                    </div>
                    {people.map((p) => {
                      const idx = cursor++;
                      const active = idx === activeIdx;
                      return (
                        <button
                          key={p.tmdb_id}
                          onClick={() => goToPerson(p)}
                          onMouseEnter={() => setActiveIdx(idx)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left group ${active ? 'bg-accent/60' : 'hover:bg-accent/40'}`}
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0 border border-border/20">
                            {p.photo ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-sm">{p.name[0]}</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">{highlight(p.name, query)}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[9px] h-4 px-1.5">{p.known_for_department}</Badge>
                              {p.known_for.length > 0 && <span className="text-[10px] text-muted-foreground line-clamp-1">{p.known_for.join(', ')}</span>}
                            </div>
                          </div>
                          <TrendingUp className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Footer with keyboard hints */}
            <div className="px-3 py-2 border-t border-border/20 bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><ArrowUp className="h-2.5 w-2.5" /><ArrowDown className="h-2.5 w-2.5" /> Navigate</span>
                <span className="flex items-center gap-1"><CornerDownLeft className="h-2.5 w-2.5" /> Open</span>
                <span className="hidden sm:flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border border-border/40 bg-background text-[9px]">Esc</kbd> Close</span>
              </div>
              <p className="text-[10px] text-muted-foreground">TMDB</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
