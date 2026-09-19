import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="footer">
      <div className="page-container">
        <div className="footer-content">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo-icon">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <span className="footer-brand-text">SMS Education</span>
          </div>

          {/* Copyright */}
          <p className="footer-copyright" style={{ textAlign: 'center', lineHeight: '1.5' }}>
            © {new Date().getFullYear()} Shah Muhammed Sab.<br/>
            This website is proudly developed by <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>AWO Developers</span>.<br/>
            All rights reserved.
          </p>
          
          {/* Links */}
          <nav className="footer-links">
            <Link to="/courses" className="footer-link">Courses</Link>
            <Link to="/login" className="footer-link">Portal</Link>
            <a href="mailto:codewithabdulwaheed@gmail.com" className="footer-link">Support</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
