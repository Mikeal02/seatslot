import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Clapperboard, Music, Camera, Scissors } from 'lucide-react';

interface CastMember {
  id?: number;
  name: string;
  character: string;
  photo: string | null;
  popularity?: number;
  department?: string;
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

function CrewCard({ icon: Icon, label, name, photo, personId }: { icon: any; label: string; name: string; photo?: string | null; personId?: number }) {
  const content = (
    <motion.div
      className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/20 hover:border-primary/30 transition-all group/crew cursor-pointer"
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {photo ? (
        <img src={photo} alt={name} className="w-11 h-11 rounded-full object-cover border-2 border-border/20 group-hover/crew:border-primary/40 transition-colors" />
      ) : (
        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold">{label}</p>
        <p className="font-bold text-sm truncate group-hover/crew:text-primary transition-colors">{name}</p>
      </div>
    </motion.div>
  );

  if (personId) return <Link to={`/person/${personId}`}>{content}</Link>;
  return content;
}

export function CastCarousel({ cast, director, composers, cinematographers, editors }: CastCarouselProps) {
  if (!cast || cast.length === 0) return null;
  const detailed = isCastDetailed(cast);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg cinema-gradient flex items-center justify-center shadow-lg shadow-primary/20">
          <Users className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-black tracking-tight">Cast & Crew</h3>
          <p className="text-[11px] text-muted-foreground font-medium">{cast.length} cast members</p>
        </div>
      </div>

      {/* Key Crew Row */}
      {(director || (composers && composers.length > 0) || (cinematographers && cinematographers.length > 0) || (editors && editors.length > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {director && (
            <CrewCard icon={Clapperboard} label="Director" name={director.name} photo={director.photo} />
          )}
          {composers && composers.length > 0 && (
            <CrewCard icon={Music} label="Composer" name={composers[0]} />
          )}
          {cinematographers && cinematographers.length > 0 && (
            <CrewCard icon={Camera} label="Cinematography" name={cinematographers[0]} />
          )}
          {editors && editors.length > 0 && (
            <CrewCard icon={Scissors} label="Editor" name={editors[0]} />
          )}
        </div>
      )}

      {/* Cast scroll */}
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin ">
        {detailed
          ? (cast as CastMember[]).map((member, i) => {
              const inner = (
                <motion.div
                  className={`flex-shrink-0 w-[110px] text-center group ${member.id ? 'cursor-pointer' : ''}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025 }}
                  whileHover={{ y: -3 }}
                >
                  <div className="relative w-[88px] h-[88px] mx-auto mb-2.5">
                    {/* Glow ring on hover */}
                    <div className="absolute -inset-1 rounded-full cinema-gradient opacity-0 group-hover:opacity-40 blur-sm transition-opacity duration-300" />
                    <div className="relative w-full h-full rounded-full overflow-hidden bg-muted border-2 border-border/30 group-hover:border-primary/50 transition-all duration-300 shadow-md group-hover:shadow-xl group-hover:shadow-primary/10">
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg font-black">
                          {member.name[0]}
                        </div>
                      )}
                    </div>
                    {/* Popularity indicator */}
                    {member.popularity && member.popularity > 20 && (
                      <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2">
                        <div className="h-1 w-8 rounded-full cinema-gradient shadow-sm shadow-primary/30" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-bold line-clamp-1 group-hover:text-primary transition-colors">{member.name}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1 italic mt-0.5">{member.character}</p>
                </motion.div>
              );

              return member.id ? (
                <Link key={member.name + i} to={`/person/${member.id}`}>{inner}</Link>
              ) : (
                <div key={member.name + i}>{inner}</div>
              );
            })
          : (cast as string[]).map((name, i) => (
              <motion.div
                key={name + i}
                className="flex-shrink-0 w-[100px] text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="w-[80px] h-[80px] mx-auto rounded-full overflow-hidden bg-muted border-2 border-border/30 mb-2 flex items-center justify-center text-muted-foreground text-lg font-black">
                  {name[0]}
                </div>
                <p className="text-xs font-bold line-clamp-1">{name}</p>
              </motion.div>
            ))}
      </div>
    </div>
  );
}
