import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Clapperboard, Ticket, User, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/movies', icon: Clapperboard, label: 'Movies' },
  { href: '/bookings', icon: Ticket, label: 'Bookings' },
  { href: '/wishlist', icon: Heart, label: 'Wishlist' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function MobileNavBar() {
  const location = useLocation();
  const { user } = useAuth();
  
  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  // Don't show on booking flow or auth pages
  const hiddenPaths = ['/booking/', '/auth', '/admin', '/payment'];
  const shouldHide = hiddenPaths.some(path => location.pathname.includes(path));

  useEffect(() => {
    if (shouldHide) {
      document.body.classList.remove('has-mobile-nav');
      return;
    }
    document.body.classList.add('has-mobile-nav');
    return () => document.body.classList.remove('has-mobile-nav');
  }, [shouldHide]);

  if (shouldHide) return null;

  return (
    <motion.nav 
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/30 safe-bottom"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const needsAuth = ['/bookings', '/wishlist', '/profile'].includes(item.href);
          const actualHref = needsAuth && !user ? '/auth' : item.href;
          
          return (
            <Link
              key={item.href}
              to={actualHref}
              className="relative flex flex-col items-center justify-center w-16 py-1.5 group"
            >
              {/* Active indicator pill */}
              {active && (
                <motion.div
                  className="absolute -top-1 w-8 h-1 rounded-full cinema-gradient"
                  layoutId="mobile-nav-indicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              
              <motion.div
                className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  active 
                    ? 'cinema-gradient shadow-lg shadow-primary/30' 
                    : 'bg-transparent group-hover:bg-muted/60'
                }`}
                whileTap={{ scale: 0.9 }}
              >
                <item.icon className={`h-4.5 w-4.5 transition-colors ${
                  active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                }`} />
              </motion.div>
              
              <span className={`text-[10px] font-medium mt-0.5 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </motion.nav>
  );
}
