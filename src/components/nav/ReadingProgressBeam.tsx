import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Slim gradient beam pinned to the top of the viewport that fills as the user
 * scrolls the page. Reduced-motion users get a plain static bar via CSS.
 */
export function ReadingProgressBeam() {
  const { scrollYProgress } = useScroll();
  const width = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 24,
    mass: 0.35,
  });

  return (
    <motion.div
      aria-hidden
      className="fixed left-0 right-0 top-0 z-50 h-[2px] origin-left cinema-gradient shadow-[0_0_10px_hsl(var(--primary)/0.55)] pointer-events-none"
      style={{ scaleX: width }}
    />
  );
}
