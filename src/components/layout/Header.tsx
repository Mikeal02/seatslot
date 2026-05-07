import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, User, LogOut, Ticket, Settings, Menu, X, Heart, Home, Clapperboard, Search, UserCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { Magnetic } from '@/components/effects/Magnetic';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/movies', label: 'Movies', icon: Clapperboard },
];

const userItems = [
  { href: '/bookings', label: 'My Bookings', icon: Ticket },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      <header className="sticky top-0 z-50 glass-effect safe-top">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] cinema-gradient opacity-80" />
        
        <div className="container mx-auto px-4">
          <div className="flex h-16 sm:h-[4.5rem] items-center justify-between gap-2">
            <Magnetic strength={0.25}>
              <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
                <motion.div
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  className="relative h-9 w-9 rounded-xl cinema-gradient flex items-center justify-center shadow-lg shadow-primary/20 logo-aura"
                >
                  <Film className="h-5 w-5 text-primary-foreground relative z-10" />
                </motion.div>
                <span className="text-lg sm:text-xl font-black cinema-gradient-text tracking-tighter">
                  CineBook
                </span>
              </Link>
            </Magnetic>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                    isActive(link.href)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <link.icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              ))}
              {user && userItems.slice(0, 2).map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                    isActive(link.href)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <link.icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Desktop Search */}
              <div className="hidden md:block">
                <GlobalSearch variant="desktop" />
              </div>

              <ThemeToggle />

              {/* Mobile hamburger */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9 rounded-full relative"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <X className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Menu className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>

              {/* Desktop user menu */}
              <div className="hidden lg:block">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="rounded-full h-10 w-10 p-0 bg-primary/10 hover:bg-primary/20 border border-primary/20"
                      >
                        <User className="h-4.5 w-4.5 text-primary" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 rounded-xl">
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="flex items-center gap-3 py-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/bookings" className="flex items-center gap-3 py-2">
                          <Ticket className="h-4 w-4 text-muted-foreground" />
                          <span>My Bookings</span>
                        </Link>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link to="/admin" className="flex items-center gap-3 py-2">
                              <Settings className="h-4 w-4 text-muted-foreground" />
                              <span>Admin Panel</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleSignOut} 
                        className="flex items-center gap-3 py-2 text-destructive focus:text-destructive"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Magnetic strength={0.4}>
                    <Button
                      asChild
                      className="cinema-gradient btn-professional shadow-lg shadow-primary/25 h-9 px-6 text-sm font-bold rounded-full tracking-wide"
                    >
                      <Link to="/auth">Sign In</Link>
                    </Button>
                  </Magnetic>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Full-screen mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[49] lg:hidden"
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-background/95 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
            />

            {/* Menu content */}
            <motion.div
              className="absolute inset-x-0 top-16 sm:top-[4.5rem] bottom-0 overflow-y-auto"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Mobile Search */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <GlobalSearch variant="mobile" onNavigate={closeMobileMenu} />
                </motion.div>

                {/* Navigation Links */}
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-4 mb-2">Navigate</p>
                  {navItems.map((link, i) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                    >
                      <Link
                        to={link.href}
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                          isActive(link.href)
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive(link.href) ? 'cinema-gradient' : 'bg-muted'
                        }`}>
                          <link.icon className={`h-4.5 w-4.5 ${isActive(link.href) ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                        </div>
                        <span className="text-base font-semibold">{link.label}</span>
                        {isActive(link.href) && (
                          <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                        )}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* User Links */}
                {user && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-4 mb-2">Account</p>
                    {userItems.map((link, i) => (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.05 }}
                      >
                        <Link
                          to={link.href}
                          onClick={closeMobileMenu}
                          className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                            isActive(link.href)
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'text-foreground hover:bg-muted/50'
                          }`}
                        >
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive(link.href) ? 'cinema-gradient' : 'bg-muted'
                          }`}>
                            <link.icon className={`h-4.5 w-4.5 ${isActive(link.href) ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                          </div>
                          <span className="text-base font-semibold">{link.label}</span>
                          {isActive(link.href) && (
                            <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                          )}
                        </Link>
                      </motion.div>
                    ))}

                    {isAdmin && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 }}
                      >
                        <Link
                          to="/admin"
                          onClick={closeMobileMenu}
                          className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                            location.pathname.startsWith('/admin')
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'text-foreground hover:bg-muted/50'
                          }`}
                        >
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                            location.pathname.startsWith('/admin') ? 'cinema-gradient' : 'bg-muted'
                          }`}>
                            <Shield className={`h-4.5 w-4.5 ${location.pathname.startsWith('/admin') ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                          </div>
                          <span className="text-base font-semibold">Admin Panel</span>
                        </Link>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Bottom actions */}
                <motion.div
                  className="pt-4 border-t border-border/30 space-y-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {user ? (
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                        <LogOut className="h-4.5 w-4.5 text-destructive" />
                      </div>
                      <span className="text-base font-semibold">Sign Out</span>
                    </button>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={closeMobileMenu}
                      className="block"
                    >
                      <Button className="w-full h-12 cinema-gradient btn-professional shadow-lg shadow-primary/25 text-base font-bold rounded-xl tracking-wide">
                        Sign In
                      </Button>
                    </Link>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
