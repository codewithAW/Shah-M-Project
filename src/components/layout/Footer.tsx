import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="page-container py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">SMS Education</span>
          </div>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground order-3 sm:order-2">
            © {new Date().getFullYear()} Shah Muhammed Sab. All rights reserved.
          </p>
          
          {/* Links */}
          <nav className="flex items-center gap-6 text-xs font-medium text-muted-foreground order-2 sm:order-3">
            <Link to="/courses" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/courses" className="hover:text-foreground transition-colors">Terms</Link>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
