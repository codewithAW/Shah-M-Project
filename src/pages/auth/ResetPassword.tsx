import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, BookOpen } from 'lucide-react';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassButton } from '../../components/ui/GlassButton';
import { supabase } from '../../services/supabase/client';

export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  // Ensure we are in a recovery session before allowing reset
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // If they get here without a session, they probably clicked an expired link
        navigate('/login', { replace: true });
      }
    });
  }, [navigate]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;
      
      // Password updated successfully, they are already signed in from the link
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Update password error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-background">
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>

      <div className="glass-panel w-full max-w-md p-8 rounded-3xl relative z-10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Set new password</h2>
          <p className="text-sm text-muted-foreground mt-2 text-center">Please enter your new password below.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1">New Password</label>
              <GlassInput 
                type="password" 
                placeholder="••••••••" 
                icon={<Lock className="h-4 w-4" />}
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1">Confirm New Password</label>
              <GlassInput 
                type="password" 
                placeholder="••••••••" 
                icon={<Lock className="h-4 w-4" />}
                required
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <GlassButton variant="primary" className="w-full h-12" type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update password'}
          </GlassButton>
        </form>
      </div>
    </div>
  );
}
