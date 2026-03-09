import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Film } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <motion.div
        className={cn('text-primary', sizeClasses[size])}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Film className="w-full h-full" />
      </motion.div>
      {text && <span className="text-sm text-muted-foreground font-medium">{text}</span>}
    </div>
  );
}

interface PageLoaderProps {
  text?: string;
}

export function PageLoader({ text }: PageLoaderProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <motion.div
        className="flex flex-col items-center gap-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated logo */}
        <div className="relative">
          <motion.div
            className="absolute -inset-3 rounded-2xl cinema-gradient opacity-20 blur-lg"
            animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="relative h-14 w-14 rounded-xl cinema-gradient flex items-center justify-center shadow-lg shadow-primary/20"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Film className="h-7 w-7 text-primary-foreground" />
          </motion.div>
        </div>

        {/* Loading bar */}
        <div className="w-32 h-0.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full cinema-gradient rounded-full"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '50%' }}
          />
        </div>

        {text && (
          <p className="text-xs text-muted-foreground font-medium tracking-wide">{text}</p>
        )}
      </motion.div>
    </div>
  );
}

interface ContentLoaderProps {
  rows?: number;
  className?: string;
}

export function ContentLoader({ rows = 3, className }: ContentLoaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-muted rounded-lg skeleton-shimmer" style={{ width: `${Math.random() * 40 + 60}%` }} />
          <div className="h-4 bg-muted rounded-lg skeleton-shimmer" style={{ width: `${Math.random() * 30 + 40}%` }} />
        </div>
      ))}
    </div>
  );
}

interface CardSkeletonProps {
  className?: string;
}

export function CardSkeleton({ className }: CardSkeletonProps) {
  return (
    <div className={cn('rounded-2xl border border-border/20 bg-card overflow-hidden', className)}>
      <div className="aspect-[2/3] bg-muted skeleton-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded-lg skeleton-shimmer w-3/4" />
        <div className="h-3 bg-muted rounded-lg skeleton-shimmer w-1/2" />
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-muted rounded-full skeleton-shimmer" />
          <div className="h-5 w-12 bg-muted rounded-full skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
