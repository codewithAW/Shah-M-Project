import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, BookOpen, User, Hash, Mail, ShieldAlert } from 'lucide-react';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassButton } from '../../components/ui/GlassButton';
import { supabase } from '../../services/supabase/client';
import { motion } from 'framer-motion';

type LoginTab = 'student' | 'teacher' | 'admin';

export function Login() {
  const [activeTab, setActiveTab] = useState<LoginTab>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const message = location.state?.message;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let emailToUse = identifier;

      if (activeTab === 'student') {
        const rollNum = identifier.toUpperCase().replace(/\s+/g, '');
        emailToUse = `${rollNum}@student.shahmuhammed.local`;
      } else if (activeTab === 'teacher') {
        const username = identifier.toLowerCase().replace(/\s+/g, '');
        emailToUse = `${username}@teacher.shahmuhammed.local`;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (signInError) throw signInError;

      // 1. Check if the user is in the admin table
      const { data: adminData } = await supabase
        .from('admin')
        .select('role')
        .eq('auth_user_id', data.user?.id)
        .single();
        
      if (adminData?.role === 'admin') {
        navigate('/admin', { replace: true });
        return;
      }

      // 2. Otherwise check normal profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user?.id)
        .single();
        
      if (profile?.role === 'teacher') navigate('/teacher', { replace: true });
      else navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message.includes('Invalid login credentials')) {
        setError('Invalid credentials. Please try again.');
      } else {
        setError(err.message || 'An unexpected error occurred during login.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = (tab: LoginTab) => {
    setActiveTab(tab);
    setIdentifier('');
    setPassword('');
    setError(null);
  };

  return (
    <div className="auth-container">
      <div className="auth-glow-1"></div>
      <div className="auth-glow-2"></div>

      <div className="glass-card auth-card">
        <div className="auth-header">
          <div className="auth-header-icon">
            <BookOpen style={{ height: '1.5rem', width: '1.5rem' }} />
          </div>
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        {/* Custom Tab Selector */}
        <div className="auth-tabs">
          <button
            type="button"
            onClick={() => resetForm('student')}
            className={`auth-tab ${activeTab === 'student' ? 'is-active' : ''}`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => resetForm('teacher')}
            className={`auth-tab ${activeTab === 'teacher' ? 'is-active' : ''}`}
          >
            Teacher
          </button>
          <button
            type="button"
            onClick={() => resetForm('admin')}
            className={`auth-tab ${activeTab === 'admin' ? 'is-active' : ''}`}
          >
            Admin
          </button>
        </div>

        {message && (
          <div className="glass-card" style={{ padding: 'var(--space-3)', marginBottom: 'var(--space-6)', backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)', color: 'var(--color-success)', textAlign: 'center', fontSize: 'var(--font-size-sm)' }}>
            {message}
          </div>
        )}

        {error && (
          <div className="glass-card" style={{ padding: 'var(--space-3)', marginBottom: 'var(--space-6)', backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--color-danger)', textAlign: 'center', fontSize: 'var(--font-size-sm)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
          >
            <div className="auth-form-group">
              <label className="auth-label">
                {activeTab === 'student' ? 'Roll Number' : activeTab === 'teacher' ? 'Teacher ID' : 'Admin Email'}
              </label>
              <GlassInput 
                type={activeTab === 'admin' ? 'email' : 'text'}
                placeholder={
                  activeTab === 'student' ? "Ex: 2023CS001" : 
                  activeTab === 'teacher' ? "Ex: teacher123" : 
                  "admin@example.com"
                } 
                icon={
                  activeTab === 'student' ? <Hash style={{ height: '1rem', width: '1rem' }} /> : 
                  activeTab === 'teacher' ? <User style={{ height: '1rem', width: '1rem' }} /> : 
                  <Mail style={{ height: '1rem', width: '1rem' }} />
                }
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
              />
            </div>
            <div className="auth-form-group">
              <label className="auth-label">Password</label>
              <GlassInput 
                type="password" 
                placeholder="••••••••" 
                icon={<Lock style={{ height: '1rem', width: '1rem' }} />}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </motion.div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
            <div />
            {activeTab === 'student' && (
              <Link to="/forgot-password" style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-primary)', textDecoration: 'none' }}>Forgot password?</Link>
            )}
            {activeTab === 'admin' && (
              <span style={{ color: 'var(--color-muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: 'var(--font-size-xs)' }}>
                <ShieldAlert style={{ height: '0.75rem', width: '0.75rem' }} /> Privileged Access
              </span>
            )}
          </div>

          <GlassButton variant="primary" style={{ width: '100%', height: '3rem' }} type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </GlassButton>
        </form>

        {activeTab === 'student' && (
          <p className="auth-footer">
            Don't have an account?{' '}
            <Link to="/register" style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-primary)', textDecoration: 'none' }}>
              Sign up for free
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
