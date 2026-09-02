import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Mail } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MetaTags } from "@/components/MetaTags";

const faqs = [
  {
    q: "How do I book a ticket?",
    a: "Pick a movie, choose a showtime, select your seats on the live seat map, add snacks if you like, and pay securely with Stripe. Your ticket with a QR-ready booking reference appears instantly under My Bookings.",
  },
  {
    q: "Can I choose my own seats?",
    a: "Yes. Our seat map shows real-time availability — green seats are available, amber seats are temporarily held by other guests, and red seats are booked. When you select a seat, it's held for you for 10 minutes while you complete payment.",
  },
  {
    q: "What happens if my 10-minute seat hold expires?",
    a: "The hold releases automatically and the seats become available to everyone again. Simply select them once more if they're still free — nothing is charged for an expired hold.",
  },
  {
    q: "How do payments work? Is it secure?",
    a: "All payments are processed by Stripe over an encrypted connection. CineBook never sees or stores your card number. After payment, Stripe returns you to our confirmation page where your booking is verified and finalised.",
  },
  {
    q: "Can I cancel or get a refund?",
    a: "Bookings can be cancelled up to 2 hours before showtime from the My Bookings page. Eligible refunds are issued automatically to your original payment method within 5–10 business days. Convenience fees are non-refundable.",
  },
  {
    q: "Do I need an account to book?",
    a: "Yes — a free account keeps your tickets, booking history, loyalty points, and wishlist in one place, and lets us send your ticket confirmation by email.",
  },
  {
    q: "What are loyalty points?",
    a: "You earn 1 point for every ₹1 spent on tickets and concessions. Points accumulate on your profile and unlock member perks as our rewards programme rolls out.",
  },
  {
    q: "How do I use my ticket at the theatre?",
    a: "Show the booking confirmation — on your phone or the downloaded PDF — at the entrance. Staff will scan or verify your booking reference and seat numbers.",
  },
  {
    q: "The movie details look wrong. Why?",
    a: "Our catalogue data comes from TMDB and refreshes continuously. If you spot an inaccuracy, the listing usually self-corrects on the next sync; otherwise let us know via the contact details below.",
  },
];

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3) }}
      className={`tile-elite overflow-hidden ${open ? "" : "tile-elite-lift"}`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="focus-ring flex w-full items-center justify-between gap-4 p-5 sm:p-6 text-left"
      >
        <span className="display-tight text-base sm:text-lg font-bold">
          {q}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-background/40"
        >
          <ChevronDown className="h-4 w-4 text-primary" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="px-5 sm:px-6 pb-6">
              <div className="divider-soft mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {a}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  return (
    <motion.div
      className="min-h-screen flex flex-col bg-background"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <MetaTags
        title="FAQs"
        description="Answers to common questions about booking tickets, seat selection, payments, refunds, and loyalty points on CineBook."
      />
      <Header />

      <main id="main-content" className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[720px] h-[320px] bg-[radial-gradient(ellipse,hsl(var(--primary)/0.08)_0%,transparent_70%)] pointer-events-none" />
          <div className="container mx-auto px-4 section-y max-w-3xl text-center relative">
            <p className="eyebrow mb-4">Help center</p>
            <h1 className="display-tight text-4xl sm:text-5xl font-extrabold">
              Frequently asked{" "}
              <span className="cinema-gradient-text">questions</span>
            </h1>
            <p className="mt-5 text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Everything you need to know about booking, seats, payments, and
              refunds.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16 max-w-3xl space-y-4">
          {faqs.map((f, i) => (
            <FaqItem key={f.q} q={f.q} a={f.a} index={i} />
          ))}
        </section>

        <section className="container mx-auto px-4 pb-20 max-w-3xl">
          <div className="tile-elite sheen p-8 sm:p-10 text-center">
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl cinema-gradient shadow-lg shadow-primary/20">
              <Mail className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="display-tight text-xl sm:text-2xl font-extrabold">
              Still stuck?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Reach us at{" "}
              <a
                href="mailto:support@cinebook.com"
                className="text-primary hover:underline font-medium"
              >
                support@cinebook.com
              </a>{" "}
              — we reply within one business day.
            </p>
            <p className="mt-4 text-xs text-muted-foreground/60">
              For the rules of the road, see our{" "}
              <Link to="/legal" className="text-primary hover:underline">
                Terms &amp; Privacy
              </Link>
              .
            </p>
          </div>
        </section>
      </main>

      <Footer />
      <div className="h-16 lg:hidden" />
    </motion.div>
  );
}
