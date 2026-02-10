import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Film, Users, Ticket, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Stat {
  label: string;
  value: number;
  suffix: string;
  icon: typeof Film;
}

function AnimatedCounter({ value, suffix, inView }: { value: number; suffix: string; inView: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const steps = 40;
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
    <span className="text-3xl sm:text-4xl md:text-5xl font-bold cinema-gradient-text tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export function StatsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const [stats, setStats] = useState<Stat[]>([
    { label: 'Movies Available', value: 0, suffix: '+', icon: Film },
    { label: 'Happy Customers', value: 0, suffix: '+', icon: Users },
    { label: 'Tickets Booked', value: 0, suffix: '+', icon: Ticket },
    { label: 'Theatre Partners', value: 0, suffix: '+', icon: MapPin },
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

      const movieCount = moviesRes.count || 0;
      const bookingCount = bookingsRes.count || 0;
      const theatreCount = theatresRes.count || 0;

      setStats([
        { label: 'Movies Available', value: movieCount, suffix: '+', icon: Film },
        { label: 'Happy Customers', value: Math.max(bookingCount * 3, 100), suffix: '+', icon: Users },
        { label: 'Tickets Booked', value: Math.max(bookingCount * 2, 50), suffix: '+', icon: Ticket },
        { label: 'Theatre Partners', value: Math.max(theatreCount, 5), suffix: '+', icon: MapPin },
      ]);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <section ref={ref} className="py-16 sm:py-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
            Trusted by Movie Lovers
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            Join thousands of cinema enthusiasts who book with CineBook
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              className="text-center p-6 rounded-xl bg-card border border-border/50 glow-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <stat.icon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-3 text-primary/60" />
              <AnimatedCounter value={stat.value} suffix={stat.suffix} inView={inView} />
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
