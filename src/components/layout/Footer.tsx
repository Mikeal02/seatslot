import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Film, Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone, ArrowUpRight, Sparkles } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    quickLinks: [
      { label: 'Home', href: '/' },
      { label: 'Movies', href: '/movies' },
      { label: 'My Bookings', href: '/bookings' },
    ],
    support: [
      { label: 'Help Center', href: '#' },
      { label: 'Contact Us', href: '#' },
      { label: 'FAQs', href: '#' },
      { label: 'Refund Policy', href: '#' },
    ],
    legal: [
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Cookie Policy', href: '#' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Youtube, href: '#', label: 'Youtube' },
  ];

  return (
    <footer className="bg-card/20 border-t border-border/15 mt-auto relative overflow-hidden">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] cinema-gradient opacity-50" />
      
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,hsl(var(--primary)/0.03)_0%,transparent_70%)]" />

      {/* Newsletter CTA band */}
      <div className="relative border-b border-border/15">
        <div className="container mx-auto px-4 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-2 glass-card px-3 py-1.5 rounded-full mb-3">
                <Sparkles className="h-3 w-3 text-accent" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Stay updated</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black">
                Never miss a <span className="cinema-gradient-text">premiere</span>
              </h3>
              <p className="text-sm text-muted-foreground mt-1.5">Get notified about new releases and exclusive offers</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <input 
                type="email" 
                placeholder="your@email.com"
                className="flex-1 sm:w-64 h-11 px-4 rounded-full bg-muted/30 border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all placeholder:text-muted-foreground/50"
              />
              <button className="h-11 px-6 rounded-full cinema-gradient btn-professional text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 shrink-0">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 sm:py-20 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-12 md:gap-14">
          {/* Brand Column */}
          <div className="col-span-2 sm:col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-7 group">
              <div className="h-10 w-10 rounded-2xl cinema-gradient flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow duration-500">
                <Film className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-black cinema-gradient-text">CineBook</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-7 max-w-xs leading-relaxed">
              Your ultimate destination for seamless movie ticket booking. Experience cinema like never before.
            </p>
            
            <div className="flex gap-2.5">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-10 w-10 rounded-xl bg-muted/20 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all duration-300 border border-border/15 hover:border-primary hover:shadow-lg hover:shadow-primary/20"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="section-label mb-6 text-foreground/80">Quick Links</h4>
            <ul className="space-y-3.5">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="section-label mb-6 text-foreground/80">Support</h4>
            <ul className="space-y-3.5">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="section-label mb-6 text-foreground/80">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                <span>123 Cinema Street, Movie City</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0 text-primary/70" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary/70" />
                <span>support@cinebook.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border/15">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground/50 font-medium tracking-wide">
              © {currentYear} CineBook. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-7">
              {footerLinks.legal.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-xs text-muted-foreground/50 hover:text-primary transition-colors duration-200 font-medium"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
