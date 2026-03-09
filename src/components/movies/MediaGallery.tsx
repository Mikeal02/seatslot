import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Play, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface MediaGalleryProps {
  backdrops?: string[];
  posters?: string[];
  logos?: string[];
  videos?: { key: string; name: string; type: string; official: boolean }[];
}

export function MediaGallery({ backdrops = [], posters = [], logos = [], videos = [] }: MediaGalleryProps) {
  const [activeTab, setActiveTab] = useState<'backdrops' | 'posters' | 'videos'>('backdrops');
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [videoKey, setVideoKey] = useState<string | null>(null);

  const hasContent = backdrops.length > 0 || posters.length > 0 || videos.length > 0;
  if (!hasContent) return null;

  const tabs = [
    { id: 'backdrops' as const, label: 'Backdrops', count: backdrops.length },
    { id: 'posters' as const, label: 'Posters', count: posters.length },
    { id: 'videos' as const, label: 'Videos', count: videos.length },
  ].filter(t => t.count > 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg cinema-gradient flex items-center justify-center">
            <Image className="h-4 w-4 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-bold tracking-tight">Media Gallery</h3>
        </div>
        <div className="flex gap-1.5 bg-muted/50 p-1 rounded-lg border border-border/30">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === t.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'backdrops' && (
          <motion.div key="backdrops" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {backdrops.map((url, i) => (
              <motion.div
                key={i}
                className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group border border-border/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setLightboxImg(url)}
              >
                <img src={url} alt={`Backdrop ${i + 1}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'posters' && (
          <motion.div key="posters" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {posters.map((url, i) => (
              <motion.div
                key={i}
                className="relative aspect-[2/3] rounded-lg overflow-hidden cursor-pointer group border border-border/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setLightboxImg(url)}
              >
                <img src={url} alt={`Poster ${i + 1}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'videos' && (
          <motion.div key="videos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {videos.map((v, i) => (
              <motion.div
                key={v.key}
                className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group border border-border/20 bg-muted"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setVideoKey(v.key)}
              >
                <img src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`} alt={v.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/20 group-hover:bg-foreground/30 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-card/90 backdrop-blur flex items-center justify-center shadow-lg">
                    <Play className="h-5 w-5 text-foreground ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-card to-transparent">
                  <p className="text-xs font-semibold line-clamp-1">{v.name}</p>
                  <p className="text-[10px] text-muted-foreground">{v.type}{v.official ? ' • Official' : ''}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Lightbox */}
      <Dialog open={!!lightboxImg} onOpenChange={() => setLightboxImg(null)}>
        <DialogContent className="max-w-4xl p-1 bg-card border-border/30">
          {lightboxImg && <img src={lightboxImg} alt="Full size" className="w-full h-auto rounded-lg" />}
        </DialogContent>
      </Dialog>

      {/* Video Player */}
      <Dialog open={!!videoKey} onOpenChange={() => setVideoKey(null)}>
        <DialogContent className="max-w-3xl p-0 bg-card border-border/30 aspect-video">
          {videoKey && (
            <iframe
              src={`https://www.youtube.com/embed/${videoKey}?autoplay=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
