import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { GlassButton } from '../ui/GlassButton';
import { NotificationBell } from '../ui/NotificationBell';
import { useAuth } from '../../hooks/useAuth';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { session, profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    setIsOpen(false);
  };

  const baseLinks = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
  ];

  const studentLinks = [
    ...baseLinks,
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Assignments', path: '/assignments' },
    { name: 'Quizzes', path: '/quizzes' },
    { name: 'Results', path: '/results' },
  ];

  const teacherLinks = [
    ...baseLinks,
    { name: 'Teacher Dashboard', path: '/teacher' },
  ];

  const adminLinks = [
    ...baseLinks,
    { name: 'Teacher Management', path: '/admin' },
  ];

  const navLinks = session 
    ? (profile?.role === 'admin' ? adminLinks : profile?.role === 'teacher' ? teacherLinks : studentLinks)
    : baseLinks;

  return (
    <div className="navbar-wrapper">
      <header className="navbar-inner glass-nav">
        <div className="navbar-content">
          {/* Logo */}
          <div className="navbar-logo">
            <Link to="/" className="navbar-logo-link group">
              <div className="navbar-logo-icon group-hover:scale-105">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <span className="navbar-logo-text">SMS Education</span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="navbar-desktop-nav">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`navbar-nav-link ${isActive ? 'is-active' : ''}`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Right Actions */}
            <div className="navbar-right">
              <ThemeToggle />
              
              {session ? (
                <>
                  <NotificationBell />
                  <div className="w-px h-6 bg-border mx-1"></div>
                  <Link to="/profile">
                    <GlassButton variant="ghost" size="sm">
                      <UserIcon className="h-4 w-4" />
                      <span className="hidden xl:inline">Profile</span>
                    </GlassButton>
                  </Link>
                  <GlassButton variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-danger">
                    <LogOut className="h-4 w-4" />
                  </GlassButton>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <GlassButton variant="ghost" size="md">Login</GlassButton>
                  </Link>
                  <Link to="/register">
                    <GlassButton variant="primary" size="md">Sign Up</GlassButton>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Right */}
            <div className="navbar-mobile-right">
              {session && <NotificationBell />}
              <ThemeToggle />
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="navbar-mobile-btn"
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

        {/* Mobile Dropdown */}
        {isOpen && (
          <div className="navbar-mobile-menu">
            <div className="navbar-mobile-nav">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={`navbar-mobile-link ${isActive ? 'is-active' : ''}`}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </div>
              <div className="navbar-mobile-footer">
                {session ? (
                  <>
                    <Link to="/profile" onClick={() => setIsOpen(false)}>
                      <GlassButton variant="ghost" className="w-full justify-start h-11 bg-white/50 dark:bg-black/20">
                        <UserIcon className="h-4 w-4" /> Profile
                      </GlassButton>
                    </Link>
                    <GlassButton variant="ghost" onClick={handleLogout} className="w-full justify-start h-11 text-danger hover:text-danger hover:bg-danger/10">
                      <LogOut className="h-4 w-4" /> Logout
                    </GlassButton>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <GlassButton variant="ghost" className="w-full justify-center h-11 bg-white/50 dark:bg-black/20">Login</GlassButton>
                    </Link>
                    <Link to="/register" onClick={() => setIsOpen(false)}>
                      <GlassButton variant="primary" className="w-full justify-center" size="md">Sign Up</GlassButton>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
      </header>
    </div>
  );
}
