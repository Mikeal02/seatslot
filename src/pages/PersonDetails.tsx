import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Star, Film, Tv, Award, TrendingUp, ExternalLink, Users, BarChart3, Clock } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MetaTags } from '@/components/MetaTags';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

interface FilmCredit {
  tmdb_id: number;
  title: string;
  character?: string;
  job?: string;
  department?: string;
  poster_url: string | null;
  backdrop_url?: string | null;
  release_date: string;
  rating: number;
  vote_count: number;
  popularity: number;
  overview?: string;
  credit_type: 'cast' | 'crew';
}

interface TVCredit {
  tmdb_id: number;
  name: string;
  character: string;
  poster_url: string | null;
  first_air_date: string;
  rating: number;
  episode_count: number;
}

interface PersonPhoto {
  url: string;
  width: number;
  height: number;
  aspect_ratio: number;
  vote_average: number;
}

interface PersonData {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  photo: string | null;
  known_for_department: string;
  popularity: number;
  gender: number;
  homepage: string | null;
  also_known_as: string[];
  external_ids: {
    imdb_id: string | null;
    facebook_id: string | null;
    instagram_id: string | null;
    twitter_id: string | null;
    tiktok_id: string | null;
    youtube_id: string | null;
    wikidata_id: string | null;
  };
  known_for: FilmCredit[];
  filmography_cast: FilmCredit[];
  filmography_crew: FilmCredit[];
  tv_credits: TVCredit[];
  career_stats: {
    total_movies: number;
    total_crew_credits: number;
    average_rating: number;
    highest_rated: { title: string; rating: number; tmdb_id: number } | null;
    decade_breakdown: Record<string, number>;
    active_years: string | null;
  };
  photos: PersonPhoto[];
}

function calculateAge(birthday: string, deathday?: string | null) {
  const birth = new Date(birthday);
  const end = deathday ? new Date(deathday) : new Date();
  return Math.floor((end.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-xl bg-card border border-border/30 p-4 group hover:border-primary/30 transition-colors"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 cinema-gradient opacity-50" />
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1.5">
        <Icon className="h-3.5 w-3.5" />
        <span className="uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-2xl font-black tracking-tight">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </motion.div>
  );
}

function FilmCard({ film, type = 'cast' }: { film: FilmCredit; type?: 'cast' | 'crew' }) {
  // Try to find movie in local DB to link
  const [localId, setLocalId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('movies')
      .select('id')
      .eq('tmdb_id', film.tmdb_id)
      .maybeSingle()
      .then(({ data }) => { if (data) setLocalId(data.id); });
  }, [film.tmdb_id]);

  const content = (
    <motion.div
      className="group rounded-xl overflow-hidden bg-card border border-border/30 hover:border-primary/20 transition-all duration-300 glow-card"
      whileHover={{ y: -2 }}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={film.poster_url || '/placeholder.svg'}
          alt={film.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-70" />
        {film.rating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-card/90 backdrop-blur-xl px-2 py-0.5 rounded-full text-[10px] font-bold border border-border/20">
            <Star className="h-2.5 w-2.5 fill-accent text-accent" />
            {film.rating}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-[10px] text-foreground/80 line-clamp-2">{film.overview}</p>
        </div>
      </div>
      <div className="p-3">
        <h4 className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">{film.title}</h4>
        {type === 'cast' && film.character && (
          <p className="text-[11px] text-muted-foreground italic line-clamp-1 mt-0.5">as {film.character}</p>
        )}
        {type === 'crew' && film.job && (
          <p className="text-[11px] text-primary/80 font-medium line-clamp-1 mt-0.5">{film.job}</p>
        )}
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[11px] text-muted-foreground">{film.release_date?.split('-')[0] || 'TBA'}</p>
          {film.vote_count > 0 && (
            <p className="text-[10px] text-muted-foreground">{film.vote_count > 1000 ? `${(film.vote_count / 1000).toFixed(1)}K` : film.vote_count} votes</p>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (localId) {
    return <Link to={`/movie/${localId}`}>{content}</Link>;
  }
  return content;
}

export default function PersonDetails() {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<PersonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchPerson(id);
  }, [id]);

  const fetchPerson = async (personId: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-movies?action=person&person_id=${personId}`,
        { headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
      );
      if (!res.ok) throw new Error('Failed to fetch person');
      const data = await res.json();
      setPerson(data);
    } catch (err) {
      console.error('Error fetching person:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex gap-6">
            <Skeleton className="w-48 h-72 rounded-2xl shrink-0" />
            <div className="space-y-4 flex-1">
              <Skeleton className="h-10 w-72" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 mt-8">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-5 gap-3 mt-8">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="aspect-[2/3] rounded-xl" />)}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Person not found</h1>
            <Button asChild><Link to="/">Go back home</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const genderLabel = person.gender === 1 ? 'Female' : person.gender === 2 ? 'Male' : 'Other';
  const careerStats = person.career_stats || { total_movies: 0, total_crew_credits: 0, average_rating: 0, highest_rated: null, decade_breakdown: {}, active_years: null };
  const sortedDecades = Object.entries(careerStats.decade_breakdown || {}).sort((a, b) => a[0].localeCompare(b[0]));
  const maxDecadeCount = Math.max(...sortedDecades.map(([, c]) => c), 1);

  return (
    <motion.div
      className="min-h-screen flex flex-col bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <MetaTags
        title={`${person.name} - CineBook`}
        description={person.biography?.slice(0, 155) || `Learn about ${person.name}`}
        image={person.photo || undefined}
      />
      <Header />

      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background - use known_for backdrop */}
          {person.known_for[0]?.backdrop_url && (
            <div className="absolute inset-0">
              <img src={person.known_for[0].backdrop_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-background/30" />
              <div className="absolute inset-0 noise-overlay pointer-events-none" />
            </div>
          )}

          <div className="relative container mx-auto px-4 py-10 md:py-16">
            <Button variant="ghost" size="sm" asChild className="mb-6 bg-background/30 backdrop-blur-sm">
              <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
            </Button>

            <div className="flex flex-col md:flex-row gap-6 md:gap-10">
              {/* Photo */}
              <motion.div
                className="shrink-0"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {person.photo ? (
                  <img
                    src={person.photo}
                    alt={person.name}
                    className="w-40 md:w-56 rounded-2xl shadow-2xl border-2 border-border/10 object-cover aspect-[2/3]"
                  />
                ) : (
                  <div className="w-40 md:w-56 aspect-[2/3] rounded-2xl bg-muted flex items-center justify-center text-5xl font-black text-muted-foreground">
                    {person.name[0]}
                  </div>
                )}
              </motion.div>

              {/* Info */}
              <motion.div
                className="flex-1 space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">{person.name}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge className="cinema-gradient text-primary-foreground border-0 font-bold">{person.known_for_department}</Badge>
                    {person.career_stats.active_years && (
                      <Badge variant="outline" className="text-xs">{person.career_stats.active_years}</Badge>
                    )}
                  </div>
                </div>

                {/* Quick details */}
                <div className="flex flex-wrap gap-3 text-sm">
                  {person.birthday && (
                    <div className="flex items-center gap-1.5 bg-background/40 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/20">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span>{new Date(person.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      {!person.deathday && <span className="text-muted-foreground">(age {calculateAge(person.birthday)})</span>}
                    </div>
                  )}
                  {person.deathday && (
                    <div className="flex items-center gap-1.5 bg-destructive/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-destructive/20">
                      <span className="text-destructive font-medium">
                        † {new Date(person.deathday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        {person.birthday && ` (age ${calculateAge(person.birthday, person.deathday)})`}
                      </span>
                    </div>
                  )}
                  {person.place_of_birth && (
                    <div className="flex items-center gap-1.5 bg-background/40 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/20">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{person.place_of_birth}</span>
                    </div>
                  )}
                </div>

                {/* External links */}
                <div className="flex flex-wrap gap-2">
                  {person.external_ids.imdb_id && (
                    <a href={`https://www.imdb.com/name/${person.external_ids.imdb_id}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5c518]/10 border border-[#f5c518]/30 text-xs font-bold hover:bg-[#f5c518]/20 transition-colors">
                      <span className="text-[#f5c518] font-black">IMDb</span>
                      <ExternalLink className="h-3 w-3 text-[#f5c518]" />
                    </a>
                  )}
                  {person.external_ids.instagram_id && (
                    <a href={`https://instagram.com/${person.external_ids.instagram_id}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/30 text-xs font-bold hover:bg-pink-500/20 transition-colors text-pink-400">
                      Instagram
                    </a>
                  )}
                  {person.external_ids.twitter_id && (
                    <a href={`https://twitter.com/${person.external_ids.twitter_id}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-xs font-bold hover:bg-sky-500/20 transition-colors text-sky-400">
                      Twitter/X
                    </a>
                  )}
                  {person.external_ids.tiktok_id && (
                    <a href={`https://tiktok.com/@${person.external_ids.tiktok_id}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground/5 border border-border/30 text-xs font-bold hover:bg-foreground/10 transition-colors">
                      TikTok
                    </a>
                  )}
                  {person.homepage && (
                    <a href={person.homepage} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-xs font-bold hover:bg-primary/20 transition-colors text-primary">
                      Website <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Biography */}
                {person.biography && (
                  <div>
                    <p className={`text-muted-foreground leading-relaxed text-sm ${!bioExpanded ? 'line-clamp-4' : ''}`}>
                      {person.biography}
                    </p>
                    {person.biography.length > 300 && (
                      <button
                        onClick={() => setBioExpanded(!bioExpanded)}
                        className="text-primary text-xs font-semibold mt-1 hover:underline"
                      >
                        {bioExpanded ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                )}

                {/* Also known as */}
                {person.also_known_as.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">Also known as:</span>
                    {person.also_known_as.map(name => (
                      <Badge key={name} variant="outline" className="text-[10px]">{name}</Badge>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Career Stats */}
        <section className="container mx-auto px-4 py-6">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <StatCard icon={Film} label="Total Films" value={person.career_stats.total_movies} sub={person.career_stats.total_crew_credits > 0 ? `+ ${person.career_stats.total_crew_credits} crew credits` : undefined} />
            <StatCard icon={Star} label="Avg Rating" value={person.career_stats.average_rating} sub="across all films" />
            <StatCard icon={TrendingUp} label="Popularity" value={Math.round(person.popularity)} sub="TMDB score" />
            {person.career_stats.highest_rated && (
              <StatCard icon={Award} label="Highest Rated" value={person.career_stats.highest_rated.rating} sub={person.career_stats.highest_rated.title} />
            )}
          </motion.div>

          {/* Decade breakdown */}
          {sortedDecades.length > 2 && (
            <motion.div
              className="mt-6 p-5 rounded-2xl bg-card border border-border/30"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Career Timeline
              </h3>
              <div className="flex items-end gap-2 h-24">
                {sortedDecades.map(([decade, count], i) => (
                  <div key={decade} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      className="w-full rounded-t-md cinema-gradient"
                      initial={{ height: 0 }}
                      animate={{ height: `${(count / maxDecadeCount) * 100}%` }}
                      transition={{ delay: 0.6 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
                    />
                    <span className="text-[9px] text-muted-foreground font-medium">{decade}</span>
                    <span className="text-[10px] font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </section>

        {/* Content Tabs */}
        <section className="container mx-auto px-4 py-6">
          <Tabs defaultValue="known_for" className="space-y-6">
            <TabsList className="bg-card border border-border/40 p-1 rounded-xl w-full sm:w-auto flex-wrap">
              <TabsTrigger value="known_for" className="rounded-lg text-xs sm:text-sm font-medium">Known For</TabsTrigger>
              <TabsTrigger value="filmography" className="rounded-lg text-xs sm:text-sm font-medium">
                Filmography ({person.filmography_cast.length})
              </TabsTrigger>
              {person.filmography_crew.length > 0 && (
                <TabsTrigger value="crew" className="rounded-lg text-xs sm:text-sm font-medium">
                  Behind Camera ({person.filmography_crew.length})
                </TabsTrigger>
              )}
              {person.tv_credits.length > 0 && (
                <TabsTrigger value="tv" className="rounded-lg text-xs sm:text-sm font-medium">
                  TV ({person.tv_credits.length})
                </TabsTrigger>
              )}
              {person.photos.length > 0 && (
                <TabsTrigger value="photos" className="rounded-lg text-xs sm:text-sm font-medium">
                  Photos ({person.photos.length})
                </TabsTrigger>
              )}
            </TabsList>

            {/* Known For */}
            <TabsContent value="known_for">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {person.known_for.map((film, i) => (
                  <motion.div key={film.tmdb_id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <FilmCard film={film} type="cast" />
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Full Filmography */}
            <TabsContent value="filmography">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {person.filmography_cast.map((film, i) => (
                  <motion.div key={`${film.tmdb_id}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.5) }}>
                    <FilmCard film={film} type="cast" />
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Crew Credits */}
            {person.filmography_crew.length > 0 && (
              <TabsContent value="crew">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {person.filmography_crew.map((film, i) => (
                    <motion.div key={`crew-${film.tmdb_id}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.5) }}>
                      <FilmCard film={film} type="crew" />
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            )}

            {/* TV Credits */}
            {person.tv_credits.length > 0 && (
              <TabsContent value="tv">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {person.tv_credits.map((show, i) => (
                    <motion.div
                      key={show.tmdb_id}
                      className="rounded-xl overflow-hidden bg-card border border-border/30 hover:border-primary/20 transition-all glow-card"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div className="relative aspect-[2/3] overflow-hidden">
                        <img src={show.poster_url || '/placeholder.svg'} alt={show.name} loading="lazy" className="w-full h-full object-cover" />
                        {show.rating > 0 && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-card/90 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <Star className="h-2.5 w-2.5 fill-accent text-accent" />{show.rating}
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="text-sm font-bold line-clamp-1">{show.name}</h4>
                        {show.character && <p className="text-[11px] text-muted-foreground italic line-clamp-1">as {show.character}</p>}
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-[11px] text-muted-foreground">{show.first_air_date?.split('-')[0] || 'TBA'}</p>
                          {show.episode_count > 0 && (
                            <Badge variant="secondary" className="text-[9px] py-0 px-1.5">{show.episode_count} ep</Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            )}

            {/* Photos */}
            {person.photos.length > 0 && (
              <TabsContent value="photos">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {person.photos.map((photo, i) => (
                    <motion.div
                      key={i}
                      className="relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer group border border-border/20"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSelectedPhoto(photo.url)}
                    >
                      <img src={photo.url} alt={`${person.name} photo`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
                    </motion.div>
                  ))}
                </div>

                {/* Photo lightbox */}
                <AnimatePresence>
                  {selectedPhoto && (
                    <motion.div
                      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedPhoto(null)}
                    >
                      <motion.img
                        src={selectedPhoto}
                        alt={person.name}
                        className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl border border-border/20"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.9 }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>
            )}
          </Tabs>
        </section>
      </main>

      <Footer />
    </motion.div>
  );
}
