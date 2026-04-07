import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Film, Home, Search, Clapperboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const filmFrames = Array.from({ length: 7 });

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Subtle background film strip */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <div className="flex gap-4 rotate-12 scale-150">
            {filmFrames.map((_, i) => (
              <div key={i} className="w-20 h-16 border-4 border-foreground rounded-lg" />
            ))}
          </div>
        </div>

        <div className="text-center max-w-lg relative z-10">
          {/* Animated 404 with film reel */}
          <motion.div
            className="relative inline-block mb-10"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div className="relative">
              <motion.div
                className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl cinema-gradient flex items-center justify-center mx-auto shadow-2xl shadow-primary/30"
                animate={{ rotate: [0, 2, -2, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-6xl sm:text-7xl font-black text-primary-foreground">404</span>
              </motion.div>
              <motion.div
                className="absolute -bottom-3 -right-3 w-12 h-12 rounded-xl bg-accent flex items-center justify-center shadow-lg"
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              >
                <Clapperboard className="h-6 w-6 text-accent-foreground" />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight">Scene Not Found</h1>
            <p className="text-muted-foreground mb-10 text-base leading-relaxed max-w-sm mx-auto">
              This scene was left on the cutting room floor. Let's get you back to the show.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button asChild size="lg" className="cinema-gradient btn-professional rounded-full px-8 shadow-lg shadow-primary/25">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8">
              <Link to="/movies">
                <Search className="h-4 w-4 mr-2" />
                Browse Movies
              </Link>
            </Button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
