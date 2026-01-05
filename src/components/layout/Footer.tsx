import { Film } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Film className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold cinema-gradient-text">CineBook</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your ultimate destination for booking movie tickets. Experience cinema like never before.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/movies" className="hover:text-foreground transition-colors">Movies</Link>
              </li>
              <li>
                <Link to="/bookings" className="hover:text-foreground transition-colors">My Bookings</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">Help Center</a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">Contact Us</a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">FAQs</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CineBook. All rights reserved. Built for educational purposes.</p>
        </div>
      </div>
    </footer>
  );
}
