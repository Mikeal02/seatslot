import { Film } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 mt-auto">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="col-span-2 sm:col-span-2 md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Film className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold cinema-gradient-text">CineBook</span>
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Your ultimate destination for booking movie tickets. Experience cinema like never before.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Quick Links</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
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
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Support</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
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
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Legal</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
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

        <div className="border-t border-border mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CineBook. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
