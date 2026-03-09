import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';

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

export function CastCarousel({ cast, director, composers, cinematographers, editors }: CastCarouselProps) {
  if (!cast || cast.length === 0) return null;
  const detailed = isCastDetailed(cast);

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
          ? (cast as CastMember[]).map((member, i) => {
              const inner = (
                <motion.div
                  className={`flex-shrink-0 w-[110px] text-center group ${member.id ? 'cursor-pointer' : ''}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025 }}
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
                <div className="w-[80px] h-[80px] mx-auto rounded-full overflow-hidden bg-muted border-2 border-border/30 mb-2 flex items-center justify-center text-muted-foreground text-lg font-bold">
                  {name[0]}
                </div>
                <p className="text-xs font-semibold line-clamp-1">{name}</p>
              </motion.div>
            ))}
      </div>
    </div>
  );
}
