import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

/**
 * Top-of-page cinematic scroll progress beam.
 * Two stacked layers: a thin gradient bar + a soft glow underneath.
 */
export function ScrollProgressBeam() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });
  const glow = useTransform(scaleX, (v) => 0.25 + v * 0.6);

  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const onScroll = () => setHidden(window.scrollY < 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed top-0 left-0 right-0 z-[60] transition-opacity duration-300 ${
        hidden ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <motion.div
        className="h-[3px] origin-left cinema-gradient"
        style={{ scaleX, boxShadow: '0 0 12px hsl(var(--primary) / 0.7)' }}
      />
      <motion.div
        className="h-[1px] origin-left bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 blur-[2px]"
        style={{ scaleX, opacity: glow }}
      />
    </div>
  );
}
