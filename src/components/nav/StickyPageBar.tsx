import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

interface StickyPageBarProps {
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  imageAlt?: string;
  imageShape?: "poster" | "avatar";
  action?: {
    label: string;
    onClick?: () => void;
    to?: string;
    disabled?: boolean;
  };
  /** Scroll offset (px) after which the bar appears. Default 420. */
  threshold?: number;
}

/**
 * A minimal glass sub-header that slides in after the user scrolls past the hero.
 * Mirrors the pattern used by BookMyShow / Letterboxd / Apple TV detail pages.
 */
export function StickyPageBar({
  title,
  subtitle,
  imageUrl,
  imageAlt,
  imageShape = "poster",
  action,
  threshold = 420,
}: StickyPageBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setVisible(window.scrollY > threshold);
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [threshold]);

  const ImageEl = imageUrl ? (
    <img
      src={imageUrl}
      alt={imageAlt || title}
      className={
        imageShape === "avatar"
          ? "h-9 w-9 rounded-full object-cover border border-border/40 shrink-0"
          : "h-11 w-8 rounded-md object-cover border border-border/40 shrink-0"
      }
    />
  ) : null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="sticky-page-bar"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 34 }}
          className="fixed top-[64px] inset-x-0 z-40 border-b border-border/30 bg-background/70 backdrop-blur-xl shadow-sm"
          role="region"
          aria-label={`${title} quick actions`}
        >
          <div className="container mx-auto px-3 sm:px-6 h-14 flex items-center gap-3">
            {ImageEl}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black tracking-tight truncate leading-tight">
                {title}
              </p>
              {subtitle && (
                <p className="text-[11px] text-muted-foreground truncate leading-tight">
                  {subtitle}
                </p>
              )}
            </div>
            {action &&
              (action.to ? (
                <Link
                  to={action.to}
                  className="shrink-0 inline-flex items-center justify-center h-9 px-4 rounded-lg cinema-gradient text-primary-foreground text-xs font-bold shadow-md hover:shadow-lg transition-shadow"
                >
                  {action.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="shrink-0 inline-flex items-center justify-center h-9 px-4 rounded-lg cinema-gradient text-primary-foreground text-xs font-bold shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {action.label}
                </button>
              ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
