import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Film, Home, Search, ArrowLeft, Clapperboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          {/* Animated film reel */}
          <motion.div
            className="relative inline-block mb-8"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="relative"
            >
              <Film className="h-20 w-20 sm:h-28 sm:w-28 text-primary/20" />
            </motion.div>
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-4xl sm:text-6xl font-bold cinema-gradient-text">404</span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold mb-3">Scene Not Found</h1>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base">
              Looks like this scene was left on the cutting room floor. 
              Let's get you back to the show.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button asChild className="cinema-gradient btn-professional w-full sm:w-auto">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to="/movies">
                <Search className="h-4 w-4 mr-2" />
                Browse Movies
              </Link>
            </Button>
          </motion.div>

          {/* Decorative film strip */}
          <motion.div 
            className="mt-12 flex justify-center gap-2 opacity-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            transition={{ delay: 0.6 }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-8 h-6 border-2 border-muted-foreground rounded-sm"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              />
            ))}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
