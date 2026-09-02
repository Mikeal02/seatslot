import { motion } from "framer-motion";
import { ScrollText, ShieldCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MetaTags } from "@/components/MetaTags";

type Section = { heading: string; body: string[] };

const terms: Section[] = [
  {
    heading: "1. The service",
    body: [
      "CineBook is an online movie ticket booking platform. We list showtimes, provide live seat selection, and process payments on behalf of partner theatres.",
      "By creating an account or completing a booking, you agree to these Terms of Service and our Privacy Policy below.",
    ],
  },
  {
    heading: "2. Bookings and seat holds",
    body: [
      "Selecting seats creates a temporary hold of up to 10 minutes. A booking is only confirmed once payment is completed and verified.",
      "If payment is not completed in time, the hold is released automatically and the seats return to general availability. Holds that expire are never charged.",
    ],
  },
  {
    heading: "3. Pricing and payments",
    body: [
      "All prices are displayed before checkout and include applicable ticket tiers and concession selections. Payments are processed securely by Stripe; CineBook never stores card details.",
      "A booking is final only after successful payment verification. In the rare case of a verification failure after a charge, the full amount is refunded automatically.",
    ],
  },
  {
    heading: "4. Cancellations and refunds",
    body: [
      "Bookings may be cancelled up to 2 hours before showtime from the My Bookings page. Eligible refunds are returned to the original payment method within 5–10 business days.",
      "Convenience or processing fees, where applicable, are non-refundable. No-shows and cancellations inside the 2-hour window are not eligible for refund.",
    ],
  },
  {
    heading: "5. Acceptable use",
    body: [
      "You agree not to misuse the platform — including attempting to hold seats without intent to purchase, scraping catalogue data, or interfering with the real-time availability system.",
      "We may suspend accounts that violate these terms or abuse the booking system.",
    ],
  },
  {
    heading: "6. Liability",
    body: [
      "Movie metadata (synopses, runtimes, artwork, ratings) is provided by TMDB and may occasionally be inaccurate; we refresh it continuously but cannot guarantee completeness.",
      "To the maximum extent permitted by law, CineBook's liability for any booking is limited to the amount paid for that booking.",
    ],
  },
];

const privacy: Section[] = [
  {
    heading: "1. What we collect",
    body: [
      "Account details (name, email), booking history, seat selections, loyalty points, and wishlist/rating activity — the minimum needed to run your bookings.",
      "Payment card details are never collected or stored by us; they go directly to Stripe.",
    ],
  },
  {
    heading: "2. How we use it",
    body: [
      "To confirm and deliver your tickets, show your booking history, personalise recommendations, and operate the loyalty programme.",
      "We send transactional emails (ticket confirmations). Marketing emails are only sent if you subscribe, and you can unsubscribe anytime.",
    ],
  },
  {
    heading: "3. What we never do",
    body: [
      "We do not sell your personal data. We do not share your booking history with advertisers. We do not store payment credentials.",
      "Data is shared only with the processors required to run the service (hosting, authentication, payments, and email delivery) under strict contractual safeguards.",
    ],
  },
  {
    heading: "4. Your controls",
    body: [
      "You can update your profile, clear your wishlist and ratings, or request deletion of your account and associated personal data at any time by contacting support@cinebook.com.",
      "Deletion requests are completed within 30 days, except where records must be retained for legal or accounting purposes.",
    ],
  },
  {
    heading: "5. Security",
    body: [
      "All traffic is encrypted in transit. Access to personal data is restricted by row-level security policies, and administrative actions are audited.",
      "If you believe you've found a security issue, please report it to support@cinebook.com — we take every report seriously.",
    ],
  },
];

function SectionBlock({
  sections,
  icon: Icon,
  id,
  title,
  intro,
}: {
  sections: Section[];
  icon: typeof ScrollText;
  id: string;
  title: string;
  intro: string;
}) {
  return (
    <section id={id} className="container mx-auto px-4 section-y max-w-3xl">
      <div className="flex items-center gap-4 mb-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl cinema-gradient shadow-lg shadow-primary/20">
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
        <h2 className="display-tight text-2xl sm:text-3xl font-extrabold">
          {title}
        </h2>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-xl">
        {intro}
      </p>
      <div className="space-y-4">
        {sections.map((s, i) => (
          <motion.div
            key={s.heading}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.25) }}
            className="tile-elite p-6 sm:p-7"
          >
            <h3 className="display-tight text-base sm:text-lg font-bold mb-3">
              {s.heading}
            </h3>
            <div className="space-y-2.5">
              {s.body.map((p, j) => (
                <p
                  key={j}
                  className="text-sm text-muted-foreground leading-relaxed"
                >
                  {p}
                </p>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default function Legal() {
  return (
    <motion.div
      className="min-h-screen flex flex-col bg-background"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <MetaTags
        title="Terms & Privacy"
        description="CineBook's Terms of Service and Privacy Policy — bookings, refunds, payments, and how we handle your data."
      />
      <Header />

      <main id="main-content" className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[720px] h-[320px] bg-[radial-gradient(ellipse,hsl(var(--primary)/0.08)_0%,transparent_70%)] pointer-events-none" />
          <div className="container mx-auto px-4 section-y max-w-3xl text-center relative">
            <p className="eyebrow mb-4">The fine print, plainly</p>
            <h1 className="display-tight text-4xl sm:text-5xl font-extrabold">
              Terms &amp;{" "}
              <span className="cinema-gradient-text">Privacy</span>
            </h1>
            <p className="mt-5 text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Last updated September 2026. Written to be read, not endured.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a
                href="#terms"
                className="focus-ring meta-caps inline-flex h-10 items-center rounded-xl border border-border/40 bg-background/50 px-5 backdrop-blur-md transition-colors hover:border-primary/60 hover:text-primary"
              >
                Terms of Service
              </a>
              <a
                href="#privacy"
                className="focus-ring meta-caps inline-flex h-10 items-center rounded-xl border border-border/40 bg-background/50 px-5 backdrop-blur-md transition-colors hover:border-primary/60 hover:text-primary"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </section>

        <SectionBlock
          id="terms"
          icon={ScrollText}
          title="Terms of Service"
          intro="The agreement between you and CineBook when you browse, book, and attend."
          sections={terms}
        />

        <div className="divider-soft mx-auto w-full max-w-3xl" />

        <SectionBlock
          id="privacy"
          icon={ShieldCheck}
          title="Privacy Policy"
          intro="What we collect, why, and the controls you have over it."
          sections={privacy}
        />

        <section className="container mx-auto px-4 pb-20 max-w-3xl">
          <p className="text-center text-xs text-muted-foreground/60">
            Questions about these policies? Email{" "}
            <a
              href="mailto:support@cinebook.com"
              className="text-primary hover:underline"
            >
              support@cinebook.com
            </a>
            .
          </p>
        </section>
      </main>

      <Footer />
      <div className="h-16 lg:hidden" />
    </motion.div>
  );
}
