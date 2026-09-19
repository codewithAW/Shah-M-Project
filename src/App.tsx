import { Routes, Route, Navigate } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { StudentDashboardLayout } from './layouts/StudentDashboardLayout';

import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import { RootAdminRoute } from './components/auth/RootAdminRoute';
import { useAuth } from './hooks/useAuth';

import { Home } from './pages/public/Home';
import { Courses } from './pages/public/Courses';
import { CourseDetails } from './pages/public/CourseDetails';

import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';

import { Dashboard } from './pages/student/Dashboard';
import { Lecture } from './pages/student/Lecture';
import { Assignment } from './pages/student/Assignment';
import { Quiz } from './pages/student/Quiz';
import { Results } from './pages/student/Results';
import { Profile } from './pages/student/Profile';
import { Settings } from './pages/student/Settings';
import { Notifications } from './pages/student/Notifications';
import { StudentAssignments } from './pages/student/StudentAssignments';
import { StudentQuizzes } from './pages/student/StudentQuizzes';

import CompilerConstructionApp from './pages/CompilerConstructionProject/App';

import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminCourses } from './pages/admin/AdminCourses';
import { AdminLectures } from './pages/admin/AdminLectures';
import { AdminAssignments } from './pages/admin/AdminAssignments';
import { AdminQuizzes } from './pages/admin/AdminQuizzes';
import { Approvals } from './pages/admin/Approvals';
import { AdminResults } from './pages/admin/AdminResults';
import { AdminResultDetails } from './pages/admin/AdminResultDetails';
import { AdminStudents } from './pages/admin/AdminStudents';

import { RootAdminPortal } from './pages/admin/RootAdminPortal';

import { GlassCard } from './components/ui/GlassCard';

// Generic placeholder for unimplemented admin routes
const AdminPlaceholder = ({ title }: { title: string }) => (
  <div className="dashboard-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <GlassCard className="d-flex flex-col items-center justify-center p-12 text-center shadow-sm" style={{ maxWidth: '32rem', width: '100%' }}>
      <div className="empty-state-icon" style={{ marginBottom: '1.5rem', height: '4rem', width: '4rem' }}>
        <span style={{ fontSize: '2rem' }}>🚧</span>
      </div>
      <h2 className="dashboard-title mb-4" style={{ fontSize: '1.75rem' }}>{title}</h2>
      <p className="font-bold text-xl" style={{ 
        background: 'linear-gradient(to right, var(--color-primary), #38bdf8)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '0 4px 14px rgba(99, 102, 241, 0.2)'
      }}>
        Will be available soon........
      </p>
    </GlassCard>
  </div>
);

// Redirects already authenticated users away from login/register pages
function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) return null; // Let the underlying component handle loading if needed, or wait

  if (session) {
    if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
    if (profile?.role === 'teacher') return <Navigate to="/teacher" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      {/* Auth Routes - No Navbar/Footer */}
      <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
      <Route path="/register" element={<AuthRedirect><Register /></AuthRedirect>} />
      <Route path="/forgot-password" element={<AuthRedirect><ForgotPassword /></AuthRedirect>} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public Routes with Navbar/Footer */}
      <Route element={<RootLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/course/:courseId" element={<CourseDetails />} />
      </Route>

      {/* Protected Student Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<StudentDashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assignments" element={<StudentAssignments />} />
          <Route path="/quizzes" element={<StudentQuizzes />} />
          <Route path="/assignment/:assignmentId" element={<Assignment />} />
          <Route path="/quiz/:quizId" element={<Quiz />} />
          <Route path="/results" element={<Results />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/lecture/:lectureId" element={<Lecture />} />
        </Route>
      </Route>

      {/* Compiler Construction Full Project Route - Accessible by students and teachers */}
      <Route path="/courses/compiler-construction" element={<CompilerConstructionApp />} />

      {/* Protected Admin/Teacher Routes */}
      <Route element={<AdminRoute />}>
        <Route path="/teacher" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="lectures" element={<AdminLectures />} />
          <Route path="assignments" element={<AdminAssignments />} />
          <Route path="quizzes" element={<AdminQuizzes />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="results" element={<AdminResults />} />
          <Route path="results/:studentId" element={<AdminResultDetails />} />
          <Route path="analytics" element={<AdminPlaceholder title="Analytics" />} />
          <Route path="settings" element={<AdminPlaceholder title="Settings" />} />
        </Route>
      </Route>

      {/* Protected Root Admin Routes */}
      <Route element={<RootAdminRoute />}>
        <Route path="/admin" element={<RootAdminPortal />} />
      </Route>
    </Routes>
  );
}

export default App;
