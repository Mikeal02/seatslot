import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

export function SplashScreen({ onComplete, minDuration = 1000 }: SplashScreenProps) {
  const [phase, setPhase] = useState<'logo' | 'text' | 'exit'>('logo');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 250);
    const t2 = setTimeout(() => setPhase('exit'), Math.max(minDuration - 200, 300));
    const t3 = setTimeout(onComplete, minDuration);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete, minDuration]);

  return (
    <AnimatePresence>
      {phase !== 'exit' ? null : null}
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        animate={phase === 'exit' ? { opacity: 0, scale: 1.05 } : { opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        onAnimationComplete={() => { if (phase === 'exit') onComplete(); }}
      >
        {/* Ambient background effects */}
        <div className="absolute inset-0">
          {/* Radial glow */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, hsl(var(--accent) / 0.08) 40%, transparent 70%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 0.8, 0.6] }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
          {/* Film grain */}
          <div className="absolute inset-0 noise-overlay pointer-events-none opacity-30" />
          {/* Horizontal cinematic bars */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-[12%] bg-foreground/[0.03]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ transformOrigin: 'left' }}
          />
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-[12%] bg-foreground/[0.03]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
            style={{ transformOrigin: 'right' }}
          />
        </div>

        {/* Logo container */}
        <div className="relative flex flex-col items-center gap-6">
          {/* Icon */}
          <motion.div
            className="relative"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute -inset-4 rounded-3xl cinema-gradient opacity-30 blur-xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Inner glow ring */}
            <motion.div
              className="absolute -inset-2 rounded-2xl cinema-gradient opacity-20"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
            <div className="relative h-20 w-20 rounded-2xl cinema-gradient flex items-center justify-center shadow-2xl shadow-primary/30">
              <Film className="h-10 w-10 text-primary-foreground" />
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={phase !== 'logo' ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter cinema-gradient-text">
              CineBook
            </h1>
            <motion.p
              className="text-sm text-muted-foreground font-medium tracking-[0.3em] uppercase"
              initial={{ opacity: 0, letterSpacing: '0.5em' }}
              animate={phase !== 'logo' ? { opacity: 1, letterSpacing: '0.3em' } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Premium Cinema
            </motion.p>
          </motion.div>

          {/* Loading indicator */}
          <motion.div
            className="flex items-center gap-1.5 mt-4"
            initial={{ opacity: 0 }}
            animate={phase !== 'logo' ? { opacity: 1 } : {}}
            transition={{ delay: 0.4 }}
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="h-1 w-1 rounded-full bg-primary/60"
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </motion.div>
        </div>

        {/* Bottom gradient line */}
        <motion.div
          className="absolute bottom-[12%] left-1/2 -translate-x-1/2 h-px cinema-gradient"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 120, opacity: 0.5 }}
          transition={{ duration: 1, delay: 0.8 }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
