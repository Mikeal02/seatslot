import { motion } from 'framer-motion';
import { Tv, ShoppingCart } from 'lucide-react';

interface StreamingProvidersProps {
  streaming?: { name: string; logo: string }[];
  rentBuy?: { name: string; logo: string; type: string }[];
  externalIds?: { imdb_id: string | null; facebook_id: string | null; instagram_id: string | null; twitter_id: string | null };
}

export function StreamingProviders({ streaming = [], rentBuy = [], externalIds }: StreamingProvidersProps) {
  if (streaming.length === 0 && rentBuy.length === 0 && !externalIds?.imdb_id) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg cinema-gradient flex items-center justify-center">
          <Tv className="h-4 w-4 text-primary-foreground" />
        </div>
        <h3 className="text-lg font-bold tracking-tight">Where to Watch</h3>
      </div>

      {streaming.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Streaming</p>
          <div className="flex flex-wrap gap-2">
            {streaming.map((p, i) => (
              <motion.div
                key={p.name}
                className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border/30 hover:border-primary/30 transition-colors"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <img src={p.logo} alt={p.name} className="w-7 h-7 rounded-md object-cover" />
                <span className="text-xs font-medium">{p.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {rentBuy.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Rent / Buy</p>
          <div className="flex flex-wrap gap-2">
            {rentBuy.map((p, i) => (
              <motion.div
                key={p.name + p.type}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
              >
                <img src={p.logo} alt={p.name} className="w-6 h-6 rounded object-cover" />
                <span className="text-xs font-medium">{p.name}</span>
                <span className="text-[9px] text-muted-foreground capitalize">({p.type})</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {externalIds?.imdb_id && (
        <div className="flex gap-2">
          <a
            href={`https://www.imdb.com/title/${externalIds.imdb_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5c518]/10 border border-[#f5c518]/30 text-xs font-bold hover:bg-[#f5c518]/20 transition-colors"
          >
            <span className="text-[#f5c518] font-black">IMDb</span>
          </a>
        </div>
      )}
    </div>
  );
}
