import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, X, Star, Calendar, MapPin, Film, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface CastMember {
  id?: number;
  name: string;
  character: string;
  photo: string | null;
  popularity?: number;
  department?: string;
}

interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  photo: string | null;
  known_for_department: string;
  popularity: number;
  filmography: { tmdb_id: number; title: string; character: string; poster_url: string | null; release_date: string; rating: number }[];
  photos: string[];
}

interface CastCarouselProps {
  cast: CastMember[] | string[];
  director?: { name: string; photo: string | null } | null;
  composers?: string[];
  cinematographers?: string[];
  editors?: string[];
  writers?: { name: string; job: string }[];
}

function isCastDetailed(cast: CastMember[] | string[]): cast is CastMember[] {
  return cast.length > 0 && typeof cast[0] === 'object';
}

export function CastCarousel({ cast, director, composers, cinematographers, editors, writers }: CastCarouselProps) {
  const [selectedPerson, setSelectedPerson] = useState<PersonDetails | null>(null);
  const [personLoading, setPersonLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!cast || cast.length === 0) return null;
  const detailed = isCastDetailed(cast);

  const fetchPersonDetails = async (personId: number) => {
    setPersonLoading(true);
    setDialogOpen(true);
    setSelectedPerson(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tmdb-movies?action=person&person_id=${personId}`,
        { headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
      );
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setSelectedPerson(data);
    } catch (err) {
      console.error('Error fetching person:', err);
    } finally {
      setPersonLoading(false);
    }
  };

  const calculateAge = (birthday: string, deathday?: string | null) => {
    const birth = new Date(birthday);
    const end = deathday ? new Date(deathday) : new Date();
    return Math.floor((end.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg cinema-gradient flex items-center justify-center">
          <Users className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-bold tracking-tight">Cast & Crew</h3>
          <p className="text-xs text-muted-foreground">{cast.length} cast members</p>
        </div>
      </div>

      {/* Key Crew Row */}
      {(director || (composers && composers.length > 0) || (cinematographers && cinematographers.length > 0) || (editors && editors.length > 0)) && (
        <div className="flex flex-wrap gap-3 mb-2">
          {director && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/30 min-w-[200px]">
              {director.photo ? (
                <img src={director.photo} alt={director.name} className="w-10 h-10 rounded-full object-cover border border-border/30" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {director.name[0]}
                </div>
              )}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Director</p>
                <p className="font-semibold text-sm">{director.name}</p>
              </div>
            </div>
          )}
          {composers && composers.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/30">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent text-lg">🎵</div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Music</p>
                <p className="font-semibold text-sm">{composers[0]}</p>
              </div>
            </div>
          )}
          {cinematographers && cinematographers.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/30">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg">📷</div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Cinematography</p>
                <p className="font-semibold text-sm">{cinematographers[0]}</p>
              </div>
            </div>
          )}
          {editors && editors.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/30">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-lg">✂️</div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Editor</p>
                <p className="font-semibold text-sm">{editors[0]}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cast scroll */}
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
        {detailed
          ? (cast as CastMember[]).map((member, i) => (
              <motion.div
                key={member.name + i}
                className={`flex-shrink-0 w-[110px] text-center group ${member.id ? 'cursor-pointer' : ''}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025 }}
                onClick={() => member.id && fetchPersonDetails(member.id)}
              >
                <div className="w-[85px] h-[85px] mx-auto rounded-full overflow-hidden bg-muted border-2 border-border/30 group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all duration-300 mb-2 relative">
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg font-bold">
                      {member.name[0]}
                    </div>
                  )}
                  {member.popularity && member.popularity > 20 && (
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2">
                      <div className="h-1 w-6 rounded-full cinema-gradient" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold line-clamp-1">{member.name}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-1 italic">{member.character}</p>
              </motion.div>
            ))
          : (cast as string[]).map((name, i) => (
              <motion.div
                key={name + i}
                className="flex-shrink-0 w-[100px] text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="w-[80px] h-[80px] mx-auto rounded-full overflow-hidden bg-muted border-2 border-border/30 mb-2 flex items-center justify-center text-muted-foreground text-lg font-bold">
                  {name[0]}
                </div>
                <p className="text-xs font-semibold line-clamp-1">{name}</p>
              </motion.div>
            ))}
      </div>

      {/* Person Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden border-border/40 bg-card">
          <ScrollArea className="max-h-[85vh]">
            {personLoading ? (
              <div className="p-6 space-y-4">
                <div className="flex gap-4">
                  <Skeleton className="w-28 h-36 rounded-xl shrink-0" />
                  <div className="space-y-3 flex-1">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : selectedPerson ? (
              <div>
                {/* Hero */}
                <div className="relative p-6 pb-4">
                  <div className="flex gap-5">
                    {selectedPerson.photo ? (
                      <img src={selectedPerson.photo} alt={selectedPerson.name} className="w-28 h-36 rounded-xl object-cover shadow-xl border border-border/20 shrink-0" />
                    ) : (
                      <div className="w-28 h-36 rounded-xl bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground shrink-0">
                        {selectedPerson.name[0]}
                      </div>
                    )}
                    <div className="space-y-2 min-w-0">
                      <h2 className="text-2xl font-black tracking-tight">{selectedPerson.name}</h2>
                      <Badge variant="secondary" className="text-[10px]">{selectedPerson.known_for_department}</Badge>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {selectedPerson.birthday && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(selectedPerson.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            {!selectedPerson.deathday && ` (age ${calculateAge(selectedPerson.birthday)})`}
                          </span>
                        )}
                        {selectedPerson.deathday && (
                          <span className="text-destructive">
                            † {new Date(selectedPerson.deathday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            {selectedPerson.birthday && ` (age ${calculateAge(selectedPerson.birthday, selectedPerson.deathday)})`}
                          </span>
                        )}
                      </div>
                      {selectedPerson.place_of_birth && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {selectedPerson.place_of_birth}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 fill-accent text-accent" />
                        <span className="font-semibold">{Math.round(selectedPerson.popularity)}</span>
                        <span className="text-muted-foreground">popularity</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Biography */}
                {selectedPerson.biography && (
                  <div className="px-6 pb-4">
                    <h3 className="text-sm font-bold mb-2">Biography</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-[8]">{selectedPerson.biography}</p>
                  </div>
                )}

                {/* Photo Gallery */}
                {selectedPerson.photos.length > 1 && (
                  <div className="px-6 pb-4">
                    <h3 className="text-sm font-bold mb-2">Photos</h3>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {selectedPerson.photos.map((photo, i) => (
                        <img key={i} src={photo} alt={`${selectedPerson.name} photo`} loading="lazy" className="w-20 h-28 rounded-lg object-cover shrink-0 border border-border/20 hover:scale-105 transition-transform" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Filmography */}
                {selectedPerson.filmography.length > 0 && (
                  <div className="px-6 pb-6">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <Film className="h-3.5 w-3.5" />
                      Known For ({selectedPerson.filmography.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {selectedPerson.filmography.map((film, i) => (
                        <motion.div
                          key={film.tmdb_id}
                          className="group rounded-lg overflow-hidden bg-muted/30 border border-border/20 hover:border-primary/30 transition-all"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <div className="aspect-[2/3] overflow-hidden relative">
                            <img
                              src={film.poster_url || '/placeholder.svg'}
                              alt={film.title}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {film.rating > 0 && (
                              <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-card/90 backdrop-blur px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                                <Star className="h-2 w-2 fill-accent text-accent" />
                                {film.rating}
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <p className="text-[11px] font-semibold line-clamp-1">{film.title}</p>
                            {film.character && <p className="text-[9px] text-muted-foreground line-clamp-1 italic">{film.character}</p>}
                            <p className="text-[9px] text-muted-foreground">{film.release_date?.split('-')[0] || 'TBA'}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
