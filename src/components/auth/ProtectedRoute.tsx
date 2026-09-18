import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function ProtectedRoute() {
  const { session, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Allow admins/teachers to preview quizzes
  const isQuizPreview = location.pathname.startsWith('/quiz/') && location.search.includes('preview=true');

  // Strict role check
  if (profile && profile.role !== 'student' && !isQuizPreview) {
    if (profile.role === 'admin') return <Navigate to="/admin" replace />;
    if (profile.role === 'teacher') return <Navigate to="/teacher" replace />;
  }

  // Pending approval check
  if (profile && profile.role === 'student' && profile.status === 'pending') {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-6 text-center">
        <div className="glass-panel p-8 max-w-md w-full">
          <div className="mx-auto h-16 w-16 mb-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Registration Pending</h2>
          <p className="text-muted-foreground">
            Your account is currently awaiting teacher approval. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
