import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface KineticCounterProps {
  to: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}

/**
 * Counts from 0 → target when scrolled into view. Used in section headers
 * to give a kinetic "data-driven" feel.
 */
export function KineticCounter({ to, duration = 1.4, format, className }: KineticCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => (format ? format(v) : Math.floor(v).toString()));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, to, { duration, ease: [0.25, 0.1, 0.25, 1] });
    return controls.stop;
  }, [inView, to, duration, count]);

  return (
    <motion.span ref={ref} className={className}>
      {rounded}
    </motion.span>
  );
}
