import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export function StudentDashboardLayout() {
  return (
    <div className="flex min-h-screen flex-col relative">
      <div className="app-background" />
      <Navbar />
      <main className="flex-1 page-container py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
