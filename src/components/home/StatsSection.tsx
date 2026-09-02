import { useEffect, useState, useRef, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import { Film, Users, Ticket, MapPin, Award } from "lucide-react";
import { usePlatformStats } from "@/data";
import {
  StaggerReveal,
  StaggerRevealItem,
} from "@/components/animations/ScrollAnimations";

interface Stat {
  label: string;
  value: number;
  suffix: string;
  icon: typeof Film;
  description: string;
  color: string;
}

function AnimatedCounter({
  value,
  suffix,
  inView,
}: {
  value: number;
  suffix: string;
  inView: boolean;
}) {
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
    <span className="display-tight cinema-gradient-text text-[2.5rem] font-extrabold tabular-nums sm:text-5xl md:text-6xl">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const { data } = usePlatformStats();

  const stats = useMemo<Stat[]>(() => {
    const movies = data?.movies ?? 0;
    const bookings = data?.bookings ?? 0;
    const theatres = data?.theatres ?? 0;
    return [
      {
        label: "Movies",
        value: movies,
        suffix: "+",
        icon: Film,
        description: "Available to watch",
        color: "primary",
      },
      {
        label: "Customers",
        value: data ? Math.max(bookings * 3, 100) : 0,
        suffix: "+",
        icon: Users,
        description: "Happy movie-goers",
        color: "accent",
      },
      {
        label: "Tickets",
        value: data ? Math.max(bookings * 2, 50) : 0,
        suffix: "+",
        icon: Ticket,
        description: "Booked & confirmed",
        color: "primary",
      },
      {
        label: "Theatres",
        value: data ? Math.max(theatres, 5) : 0,
        suffix: "+",
        icon: MapPin,
        description: "Partner locations",
        color: "accent",
      },
    ];
  }, [data]);

  return (
    <section ref={ref} className="py-24 sm:py-32 relative overflow-hidden">
      {/* Dramatic background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/40 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.05)_0%,transparent_55%)]" />
      <div className="absolute inset-0 noise-overlay pointer-events-none" />

      {/* Floating orbs */}
      <motion.div
        className="absolute top-20 left-[10%] w-64 h-64 rounded-full bg-primary/[0.03] blur-[80px]"
        animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-[10%] w-48 h-48 rounded-full bg-accent/[0.04] blur-[60px]"
        animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

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
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/50 px-3.5 py-1.5 backdrop-blur-md">
            <Award className="h-3.5 w-3.5 text-accent" />
            <span className="eyebrow">By the numbers</span>
          </div>
          <h2 className="display-tight mb-4 text-[2rem] font-extrabold sm:text-4xl md:text-5xl">
            Trusted by <span className="cinema-gradient-text">Movie Lovers</span>
          </h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Join thousands of cinema enthusiasts who book with CineBook every day
          </p>
          <div className="divider-soft mx-auto mt-9 max-w-xs" />
        </motion.div>

        <StaggerReveal className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {stats.map((stat) => (
            <StaggerRevealItem key={stat.label}>
              <div className="tile-elite tile-elite-lift sheen group relative h-full p-7 text-center sm:p-9">
                {/* Radial highlight on hover */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.08)_0%,transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                {/* Icon */}
                <div className="section-header-icon mx-auto mb-6 group-hover:shadow-primary/40 transition-shadow duration-500">
                  <stat.icon className="h-6 w-6 text-primary-foreground" />
                </div>

                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  inView={inView}
                />

                <p className="display-tight relative mt-4 text-sm font-bold text-foreground">
                  {stat.label}
                </p>
                <div className="divider-soft my-3.5" />
                <p className="meta-caps relative">{stat.description}</p>
              </div>
            </StaggerRevealItem>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
