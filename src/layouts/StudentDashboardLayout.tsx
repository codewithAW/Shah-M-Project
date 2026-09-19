import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export function StudentDashboardLayout() {
  return (
    <div className="app-shell">
      <div className="app-background" />
      <Navbar />
      <main className="main-content page-container py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
