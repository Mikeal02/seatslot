import { forwardRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  /** Fallback route if there is no in-app history to go back to. */
  fallback?: string;
  label?: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'ghost' | 'outline' | 'secondary' | 'link' | 'destructive';
}

/**
 * History-aware back button. Uses browser back when possible so the user's
 * navigation trail (Home → Movie → Person → Movie → Home) is preserved
 * exactly like Netflix / IMDb / Letterboxd. Falls back to a Link if the app
 * was opened directly at this route.
 */
export const BackButton = forwardRef<HTMLButtonElement, BackButtonProps>(
  ({ fallback = '/', label = 'Back', className, size = 'sm', variant = 'ghost' }, ref) => {
    const navigate = useNavigate();
    const location = useLocation();
    // `idx` grows as the user pushes history within the SPA session.
    const hasHistory = (location.key !== 'default') && (window.history.state?.idx ?? 0) > 0;

    if (!hasHistory) {
      return (
        <Button ref={ref} asChild variant={variant} size={size} className={cn('bg-background/30 backdrop-blur-sm', className)}>
          <Link to={fallback}><ArrowLeft className="h-4 w-4 mr-2" />{label}</Link>
        </Button>
      );
    }

    return (
      <Button
        ref={ref}
        type="button"
        variant={variant}
        size={size}
        onClick={() => navigate(-1)}
        className={cn('bg-background/30 backdrop-blur-sm', className)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {label}
      </Button>
    );
  }
);
BackButton.displayName = 'BackButton';
