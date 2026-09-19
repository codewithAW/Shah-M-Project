import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Book, Video, ClipboardList, CheckSquare, Users, Award, BarChart, Settings, LogOut, Menu, X, KeyRound } from 'lucide-react';
import { ThemeToggle } from '../components/layout/ThemeToggle';
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
    <div className="admin-layout">
      <div className="app-background" />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="admin-sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar glass-nav ${isSidebarOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar-header">
          <Link to="/" className="d-flex items-center gap-3">
            <div className="d-flex items-center justify-center p-2 text-primary">
              <Book className="h-4 w-4" />
            </div>
            <span className="font-bold text-base">SMS Education</span>
          </Link>
          <button className="hide-on-desktop text-muted" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/teacher' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`admin-sidebar-link ${isActive ? 'is-active' : ''}`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="d-flex items-center gap-3 mb-4 px-2">
            <div className="d-flex items-center justify-center text-primary text-sm font-bold">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full" style={{ borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                profile?.full_name?.substring(0, 2).toUpperCase() || 'A'
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{profile?.full_name || 'Admin'}</p>
              <p className="text-xs text-muted capitalize">{profile?.role || 'Teacher'}</p>
            </div>
          </div>
          <GlassButton 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full justify-start text-muted-foreground hover:text-danger hover:bg-danger/10"
            size="sm"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </GlassButton>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main-wrapper">
        <header className="admin-header glass-nav">
          <div className="d-flex items-center gap-4">
            <button
              className="hide-on-desktop text-muted"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="admin-header-title hide-on-mobile">
              {location.pathname === '/teacher' ? 'Overview' : location.pathname.split('/').pop()}
            </h2>
          </div>
          <div className="d-flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        <main className="admin-main-content" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 3.5rem)' }}>
          <div style={{ flex: 1 }}>
            <Outlet />
          </div>
          <footer style={{ padding: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-muted)', borderTop: '1px solid rgba(var(--color-border-rgb), 0.1)', marginTop: 'auto', lineHeight: '1.5' }}>
            © {new Date().getFullYear()} Shah Muhammed Sab.<br/>
            This website is proudly developed by <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>AWO Developers</span>.<br/>
            All rights reserved.
          </footer>
        </main>
      </div>
    </div>
  );
}
