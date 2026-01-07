import { useState } from 'react';
import { Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface MovieTrailerProps {
  trailerKey: string | null;
  movieTitle: string;
}

export function MovieTrailer({ trailerKey, movieTitle }: MovieTrailerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!trailerKey) return null;

  // Use youtube-nocookie.com for privacy-enhanced embedding (less likely to be blocked)
  const embedUrl = `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Play className="h-5 w-5 fill-current" />
        Watch Trailer
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black border-none">
          <DialogTitle className="sr-only">{movieTitle} - Trailer</DialogTitle>
          <div className="relative aspect-video">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <iframe
              src={embedUrl}
              title={`${movieTitle} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}