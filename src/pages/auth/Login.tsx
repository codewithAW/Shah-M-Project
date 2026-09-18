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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-background">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="glass-panel w-full max-w-md p-8 rounded-3xl relative z-10 shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
          <p className="text-sm text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        {/* Custom Tab Selector */}
        <div className="flex p-1 mb-8 bg-black/20 rounded-xl">
          <button
            type="button"
            onClick={() => resetForm('student')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'student' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => resetForm('teacher')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'teacher' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Teacher
          </button>
          <button
            type="button"
            onClick={() => resetForm('admin')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'admin' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Admin
          </button>
        </div>

        {message && (
          <div className="mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-sm text-center">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1">
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
                  activeTab === 'student' ? <Hash className="h-4 w-4" /> : 
                  activeTab === 'teacher' ? <User className="h-4 w-4" /> : 
                  <Mail className="h-4 w-4" />
                }
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1">Password</label>
              <GlassInput 
                type="password" 
                placeholder="••••••••" 
                icon={<Lock className="h-4 w-4" />}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </motion.div>

          <div className="flex items-center justify-between text-sm">
            <div />
            {activeTab === 'student' && (
              <Link to="/forgot-password" className="font-medium text-primary hover:underline">Forgot password?</Link>
            )}
            {activeTab === 'admin' && (
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <ShieldAlert className="h-3 w-3" /> Privileged Access
              </span>
            )}
          </div>

          <GlassButton variant="primary" className="w-full h-12" type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </GlassButton>
        </form>

        {activeTab === 'student' && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Sign up for free
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
