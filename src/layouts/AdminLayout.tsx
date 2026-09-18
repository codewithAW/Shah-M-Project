import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Book, Video, ClipboardList, CheckSquare, Users, Award, BarChart, Settings, LogOut, Menu, X, KeyRound } from 'lucide-react';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { cn } from '../lib/utils';
import { GlassButton } from '../components/ui/GlassButton';
import { useAuth } from '../hooks/useAuth';

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems = [
    { name: 'Overview', path: '/teacher', icon: LayoutDashboard },
    { name: 'Courses', path: '/teacher/courses', icon: Book },
    { name: 'Lectures', path: '/teacher/lectures', icon: Video },
    { name: 'Assignments', path: '/teacher/assignments', icon: ClipboardList },
    { name: 'Quizzes', path: '/teacher/quizzes', icon: CheckSquare },
    { name: 'Approvals', path: '/teacher/approvals', icon: KeyRound },
    { name: 'Students', path: '/teacher/students', icon: Users },
    { name: 'Results', path: '/teacher/results', icon: Award },
    { name: 'Analytics', path: '/teacher/analytics', icon: BarChart },
    { name: 'Settings', path: '/teacher/settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen relative">
      <div className="app-background" />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform glass-nav flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Book className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-base">SMS Education</span>
          </Link>
          <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/teacher' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-sm font-bold overflow-hidden shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile?.full_name?.substring(0, 2).toUpperCase() || 'A'
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name || 'Admin'}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.role || 'Teacher'}</p>
            </div>
          </div>
          <GlassButton 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full justify-start text-muted-foreground hover:text-error"
            size="sm"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </GlassButton>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border glass-nav px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-base font-semibold capitalize hidden sm:block">
              {location.pathname === '/teacher' ? 'Overview' : location.pathname.split('/').pop()}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
