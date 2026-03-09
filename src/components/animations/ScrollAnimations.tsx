import { useRef, ReactNode } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';

/* ─── Scroll Reveal ─── */
interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  delay?: number;
  duration?: number;
  once?: boolean;
}

export function ScrollReveal({
  children,
  className = '',
  direction = 'up',
  distance = 40,
  delay = 0,
  duration = 0.7,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: '-80px' });

  const dirMap = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, filter: 'blur(4px)', ...dirMap[direction] }}
      animate={isInView 
        ? { opacity: 1, filter: 'blur(0px)', x: 0, y: 0 } 
        : { opacity: 0, filter: 'blur(4px)', ...dirMap[direction] }
      }
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Parallax Section ─── */
interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  speed?: number; // 0 = no parallax, 0.5 = half speed, negative = opposite
  offset?: [string, string];
}

export function ParallaxSection({
  children,
  className = '',
  speed = 0.3,
  offset = ['start end', 'end start'],
}: ParallaxSectionProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset as any,
  });

  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, -speed * 100]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y: smoothY }}>
        {children}
      </motion.div>
    </div>
  );
}

/* ─── Parallax Background ─── */
interface ParallaxBackgroundProps {
  children?: ReactNode;
  className?: string;
  speed?: number;
}

export function ParallaxBackground({
  children,
  className = '',
  speed = 0.2,
}: ParallaxBackgroundProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [`${speed * 50}%`, `-${speed * 50}%`]);

  return (
    <div ref={ref} className="relative overflow-hidden">
      <motion.div
        className={`absolute inset-0 ${className}`}
        style={{ y }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ─── Scale on Scroll ─── */
interface ScrollScaleProps {
  children: ReactNode;
  className?: string;
  scaleRange?: [number, number];
}

export function ScrollScale({
  children,
  className = '',
  scaleRange = [0.92, 1],
}: ScrollScaleProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });

  const scale = useSpring(
    useTransform(scrollYProgress, [0, 1], scaleRange),
    { stiffness: 100, damping: 30 }
  );
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <motion.div
      ref={ref}
      style={{ scale, opacity }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Stagger Reveal (children appear one by one on scroll) ─── */
interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerReveal({
  children,
  className = '',
  staggerDelay = 0.08,
}: StaggerRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerRevealItem({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.97 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.6,
            ease: [0.25, 0.1, 0.25, 1],
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
