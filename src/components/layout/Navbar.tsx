import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Menu, X, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { GlassButton } from '../ui/GlassButton';
import { NotificationBell } from '../ui/NotificationBell';
import { cn } from '../../lib/utils';
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
    <header className="sticky top-0 z-50 w-full glass-nav border-b border-border">
      <div className="w-full px-3 sm:px-5">
        <div className="flex h-16 items-center">
          {/* Logo - Flex 1 pushes center items to the middle */}
          <div className="flex-1 flex justify-start">
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <span className="text-base font-bold tracking-tight text-foreground">SMS Education</span>
            </Link>
          </div>

          {/* Desktop Nav Links - Centered naturally between the two flex-1 containers */}
          <nav className="hidden lg:flex items-center justify-center gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                    isActive 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Actions - Flex 1 balances the left side and pushes content right */}
          <div className="flex-1 hidden lg:flex items-center justify-end gap-3">
            <ThemeToggle />
            
            {session ? (
              <>
                <NotificationBell />
                <Link to="/profile">
                  <GlassButton variant="ghost">
                    <UserIcon className="h-4 w-4" />
                    <span className="hidden xl:inline">Profile</span>
                  </GlassButton>
                </Link>
                <GlassButton variant="ghost" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden xl:inline">Logout</span>
                </GlassButton>
              </>
            ) : (
              <>
                <Link to="/login">
                  <GlassButton variant="ghost">Login</GlassButton>
                </Link>
                <Link to="/register">
                  <GlassButton variant="primary">Sign Up</GlassButton>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Right - Balances left side on small screens */}
          <div className="flex-1 flex items-center justify-end gap-2 lg:hidden">
              {session && <NotificationBell />}
              <ThemeToggle />
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

        {/* Mobile Dropdown */}
        {isOpen && (
          <div className="lg:hidden absolute top-full left-4 right-4 mt-2 glass-elevated rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 space-y-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={cn(
                      'block rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                      isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-secondary'
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-border p-3 flex flex-col gap-1">
              {session ? (
                <>
                  <Link to="/profile" onClick={() => setIsOpen(false)}>
                    <GlassButton variant="ghost" className="w-full justify-start h-11">
                      <UserIcon className="h-4 w-4" /> Profile
                    </GlassButton>
                  </Link>
                  <GlassButton variant="ghost" onClick={handleLogout} className="w-full justify-start h-11 text-error hover:text-error">
                    <LogOut className="h-4 w-4" /> Logout
                  </GlassButton>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <GlassButton variant="ghost" className="w-full justify-center h-11">Login</GlassButton>
                  </Link>
                  <Link to="/register" onClick={() => setIsOpen(false)}>
                    <GlassButton variant="primary" className="w-full justify-center h-11">Sign Up</GlassButton>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
