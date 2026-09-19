import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Hash, KeyRound } from 'lucide-react';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassButton } from '../../components/ui/GlassButton';

export function ForgotPassword() {
  const [rollNumber, setRollNumber] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNumber
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
        <div className="glass-panel w-full max-w-md p-8 rounded-3xl relative z-10 shadow-2xl text-center">
          <div className="h-16 w-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <KeyRound className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Request Submitted</h2>
          <p className="text-muted-foreground mb-8">
            Your password reset request has been submitted for teacher approval. Please check with your teacher to receive your new password.
          </p>
          <Link to="/login">
            <GlassButton variant="primary" className="w-full">Return to Sign In</GlassButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-background">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
      
      <div className="glass-panel w-full max-w-md p-8 rounded-3xl relative z-10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Forgot password?</h2>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Enter your Roll Number and we'll send a password reset request to your teachers.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1.5 ml-1">Roll Number</label>
            <GlassInput 
              type="text" 
              placeholder="Ex: 2023CS001" 
              icon={<Hash className="h-4 w-4" />}
              required
              value={rollNumber}
              onChange={e => setRollNumber(e.target.value.toUpperCase().replace(/\s+/g, ''))}
            />
          </div>

          <GlassButton variant="primary" className="w-full h-12" type="submit" disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Request Password Reset'}
          </GlassButton>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
