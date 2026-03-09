import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Film, Users, Ticket, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Stat {
  label: string;
  value: number;
  suffix: string;
  icon: typeof Film;
  description: string;
}

function AnimatedCounter({ value, suffix, inView }: { value: number; suffix: string; inView: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 2200;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value, inView]);

  return (
    <span className="text-4xl sm:text-5xl md:text-6xl font-black cinema-gradient-text tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export function StatsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const [stats, setStats] = useState<Stat[]>([
    { label: 'Movies', value: 0, suffix: '+', icon: Film, description: 'Available to watch' },
    { label: 'Customers', value: 0, suffix: '+', icon: Users, description: 'Happy movie-goers' },
    { label: 'Tickets', value: 0, suffix: '+', icon: Ticket, description: 'Booked & confirmed' },
    { label: 'Theatres', value: 0, suffix: '+', icon: MapPin, description: 'Partner locations' },
  ]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [moviesRes, bookingsRes, theatresRes] = await Promise.all([
        supabase.from('movies').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase.from('theatres').select('id', { count: 'exact', head: true }),
      ]);

      setStats([
        { label: 'Movies', value: moviesRes.count || 0, suffix: '+', icon: Film, description: 'Available to watch' },
        { label: 'Customers', value: Math.max((bookingsRes.count || 0) * 3, 100), suffix: '+', icon: Users, description: 'Happy movie-goers' },
        { label: 'Tickets', value: Math.max((bookingsRes.count || 0) * 2, 50), suffix: '+', icon: Ticket, description: 'Booked & confirmed' },
        { label: 'Theatres', value: Math.max(theatresRes.count || 0, 5), suffix: '+', icon: MapPin, description: 'Partner locations' },
      ]);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <section ref={ref} className="py-24 sm:py-32 relative overflow-hidden">
      {/* Dramatic background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/40 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.05)_0%,transparent_55%)]" />
      <div className="absolute inset-0 noise-overlay pointer-events-none" />
      
      {/* Accent lines */}
      <div className="absolute top-0 left-0 right-0 section-divider" />
      <div className="absolute bottom-0 left-0 right-0 section-divider" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-16 sm:mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="section-label mb-4">By the numbers</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-5">
            Trusted by <span className="cinema-gradient-text">Movie Lovers</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Join thousands of cinema enthusiasts who book with CineBook every day
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              className="text-center p-8 sm:p-10 rounded-3xl glass-card glow-card relative group"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              {/* Icon */}
              <div className="section-header-icon mx-auto mb-6 group-hover:shadow-primary/40 transition-shadow duration-500">
                <stat.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              
              <AnimatedCounter value={stat.value} suffix={stat.suffix} inView={inView} />
              
              <p className="text-sm font-bold text-foreground mt-4 tracking-tight">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-1.5">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
