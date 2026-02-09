import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

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
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

interface PageLoaderProps {
  text?: string;
}

export function PageLoader({ text = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-muted animate-pulse" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-transparent border-t-primary animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      </div>
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
          <div className="h-4 bg-muted rounded skeleton-shimmer" style={{ width: `${Math.random() * 40 + 60}%` }} />
          <div className="h-4 bg-muted rounded skeleton-shimmer" style={{ width: `${Math.random() * 30 + 40}%` }} />
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
    <div className={cn('rounded-lg border bg-card overflow-hidden', className)}>
      <div className="aspect-[2/3] bg-muted skeleton-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded skeleton-shimmer w-3/4" />
        <div className="h-3 bg-muted rounded skeleton-shimmer w-1/2" />
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-muted rounded skeleton-shimmer" />
          <div className="h-5 w-12 bg-muted rounded skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
