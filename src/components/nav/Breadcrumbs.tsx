import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface Crumb {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
  className?: string;
}

/**
 * Compact, accessible breadcrumb trail. Last item renders as current page.
 */
export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center flex-wrap gap-1 text-[11px] font-semibold text-muted-foreground">
        <li className="flex items-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1 hover:text-primary transition-colors rounded-md px-1.5 py-0.5"
            aria-label="Home"
          >
            <Home className="h-3 w-3" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </li>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1 min-w-0">
              <ChevronRight className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
              {isLast || !item.to ? (
                <span
                  className="text-foreground/90 truncate max-w-[220px] sm:max-w-[360px] px-1"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="hover:text-primary transition-colors truncate max-w-[160px] rounded-md px-1.5 py-0.5"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
