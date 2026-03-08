import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

interface CastMember {
  name: string;
  character: string;
  photo: string | null;
}

interface CastCarouselProps {
  cast: CastMember[] | string[];
}

function isCastDetailed(cast: CastMember[] | string[]): cast is CastMember[] {
  return cast.length > 0 && typeof cast[0] === 'object';
}

export function CastCarousel({ cast }: CastCarouselProps) {
  if (!cast || cast.length === 0) return null;

  const detailed = isCastDetailed(cast);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg cinema-gradient flex items-center justify-center">
          <Users className="h-4 w-4 text-primary-foreground" />
        </div>
        <h3 className="text-lg font-bold tracking-tight">Cast</h3>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {detailed
          ? (cast as CastMember[]).map((member, i) => (
              <motion.div
                key={member.name}
                className="flex-shrink-0 w-[100px] text-center group"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="w-[80px] h-[80px] mx-auto rounded-full overflow-hidden bg-muted border-2 border-border/30 group-hover:border-primary/30 transition-colors duration-300 mb-2">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg font-bold">
                      {member.name[0]}
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold line-clamp-1">{member.name}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-1">{member.character}</p>
              </motion.div>
            ))
          : (cast as string[]).map((name, i) => (
              <motion.div
                key={name}
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
