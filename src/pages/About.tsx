import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Film,
  Ticket,
  Armchair,
  ShieldCheck,
  Sparkles,
  Users,
  Star,
  ArrowUpRight,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MetaTags } from "@/components/MetaTags";

const values = [
  {
    icon: Ticket,
    title: "Booking, simplified",
    body: "From browsing to a confirmed ticket in under a minute — live seat maps, transparent pricing, and instant confirmation.",
  },
  {
    icon: Armchair,
    title: "Every seat, live",
    body: "Real-time seat availability with temporary holds while you decide, so the seat you pick is the seat you get.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    body: "Payments are processed end-to-end by Stripe. We never see or store your card details.",
  },
  {
    icon: Sparkles,
    title: "Curated discovery",
    body: "New releases, trending titles, and personalised picks powered by TMDB — refreshed continuously.",
  },
];

const stats = [
  { icon: Film, label: "Movies in catalogue", value: "1,000+" },
  { icon: Users, label: "Happy moviegoers", value: "50k+" },
  { icon: Star, label: "Average rating", value: "4.8" },
];

export default function About() {
  return (
    <motion.div
      className="min-h-screen flex flex-col bg-background"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <MetaTags
        title="About Us"
        description="Learn about CineBook — seamless movie ticket booking with live seat maps, secure payments, and curated discovery."
      />
      <Header />

      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[720px] h-[360px] bg-[radial-gradient(ellipse,hsl(var(--primary)/0.08)_0%,transparent_70%)] pointer-events-none" />
          <div className="container mx-auto px-4 section-y max-w-4xl text-center relative">
            <p className="eyebrow mb-4">Our story</p>
            <h1 className="display-tight text-4xl sm:text-5xl md:text-6xl font-extrabold">
              Cinema,{" "}
              <span className="cinema-gradient-text">without the queue</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              CineBook was built on a simple idea: going to the movies should
              start with excitement, not a box-office line. We bring live
              showtimes, real seat maps, and one-tap booking into a single,
              beautifully crafted experience.
            </p>
          </div>
        </section>

        <div className="divider-soft mx-auto w-full max-w-4xl" />

        {/* Values */}
        <section className="container mx-auto px-4 section-y max-w-5xl">
          <p className="eyebrow mb-3">What we stand for</p>
          <h2 className="display-tight text-2xl sm:text-3xl font-extrabold mb-10">
            Built for moviegoers
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="tile-elite tile-elite-lift sheen p-7 sm:p-8"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl cinema-gradient shadow-lg shadow-primary/20">
                  <v.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="display-tight text-lg font-bold mb-2">
                  {v.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {v.body}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <div className="divider-soft mx-auto w-full max-w-4xl" />

        {/* Stats */}
        <section className="container mx-auto px-4 section-y max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="tile-elite p-7 text-center"
              >
                <s.icon className="h-5 w-5 mx-auto mb-3 text-primary/80" />
                <p className="display-tight text-3xl font-extrabold tabular cinema-gradient-text">
                  {s.value}
                </p>
                <p className="meta-caps mt-2">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 pb-20 max-w-4xl">
          <div className="tile-elite sheen p-8 sm:p-12 text-center">
            <p className="eyebrow mb-3">Ready when you are</p>
            <h2 className="display-tight text-2xl sm:text-3xl font-extrabold">
              Your next premiere is{" "}
              <span className="cinema-gradient-text">one tap away</span>
            </h2>
            <Link
              to="/movies"
              className="focus-ring mt-7 inline-flex h-12 items-center gap-2 rounded-xl cinema-gradient px-8 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5"
            >
              Browse movies
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <div className="h-16 lg:hidden" />
    </motion.div>
  );
}
