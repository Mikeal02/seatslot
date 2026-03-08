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
    <span className="text-3xl sm:text-4xl md:text-5xl font-bold cinema-gradient-text tabular-nums tracking-tight">
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

      setStats([
        { label: 'Movies Available', value: moviesRes.count || 0, suffix: '+', icon: Film },
        { label: 'Happy Customers', value: Math.max((bookingsRes.count || 0) * 3, 100), suffix: '+', icon: Users },
        { label: 'Tickets Booked', value: Math.max((bookingsRes.count || 0) * 2, 50), suffix: '+', icon: Ticket },
        { label: 'Theatre Partners', value: Math.max(theatresRes.count || 0, 5), suffix: '+', icon: MapPin },
      ]);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <section ref={ref} className="py-16 sm:py-24 relative overflow-hidden noise-overlay">
      {/* Background gradient wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.04)_0%,transparent_70%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-14"
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              className="text-center p-6 sm:p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 glow-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 mb-4">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <AnimatedCounter value={stat.value} suffix={stat.suffix} inView={inView} />
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
