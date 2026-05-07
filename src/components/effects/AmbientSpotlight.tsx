import { useEffect, useRef } from 'react';

/**
 * Cursor-following ambient spotlight.
 * Renders a fixed, low-opacity radial gradient that tracks the mouse for a
 * subtle, premium "interactive light" feel across the entire app.
 */
export function AmbientSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0.5, y: 0.3 });
  const current = useRef({ x: 0.5, y: 0.3 });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX / window.innerWidth;
      target.current.y = e.clientY / window.innerHeight;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.08;
      current.current.y += (target.current.y - current.current.y) * 0.08;
      const el = ref.current;
      if (el) {
        el.style.setProperty('--sx', `${current.current.x * 100}%`);
        el.style.setProperty('--sy', `${current.current.y * 100}%`);
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="ambient-spotlight pointer-events-none fixed inset-0 z-[1] hidden md:block"
    />
  );
}
