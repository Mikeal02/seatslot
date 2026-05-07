import { Film, Star, Ticket, Popcorn, Clapperboard, Sparkles } from 'lucide-react';

const ITEMS = [
  { icon: Film, text: 'Now Showing' },
  { icon: Star, text: 'Critically Acclaimed' },
  { icon: Ticket, text: 'Reserve Your Seat' },
  { icon: Popcorn, text: 'Premium Concessions' },
  { icon: Clapperboard, text: 'Latest Releases' },
  { icon: Sparkles, text: 'Dolby Atmos · 4K HDR' },
];

/**
 * Cinematic marquee ticker — film-reel style, perfectly looped via duplication.
 */
export function CinemaTicker() {
  const sequence = [...ITEMS, ...ITEMS, ...ITEMS];
  return (
    <div className="cinema-ticker relative overflow-hidden border-y border-border/30 bg-card/30 backdrop-blur-md">
      <div className="cinema-ticker__perforation cinema-ticker__perforation--top" aria-hidden />
      <div className="cinema-ticker__track flex whitespace-nowrap py-3">
        {sequence.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-3 px-8 text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground"
            >
              <Icon className="h-3.5 w-3.5 text-primary" />
              <span>{item.text}</span>
              <span className="text-primary/40">✦</span>
            </div>
          );
        })}
      </div>
      <div className="cinema-ticker__perforation cinema-ticker__perforation--bottom" aria-hidden />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
