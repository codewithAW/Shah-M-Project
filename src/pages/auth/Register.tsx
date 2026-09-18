import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, BookOpen, Hash } from 'lucide-react';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassButton } from '../../components/ui/GlassButton';

export function Register() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/register-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name,
          username,
          rollNumber,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Registration successful, redirect to login
      navigate('/login', { replace: true, state: { message: 'Registration successful. Please sign in with your Roll Number.' } });

    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'An unexpected error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-background">
      {/* Background Orbs */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="glass-panel w-full max-w-md p-8 rounded-3xl relative z-10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Student Registration</h2>
          <p className="text-sm text-muted-foreground mt-2">Start your learning journey today</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1">Full Name</label>
              <GlassInput 
                type="text" 
                placeholder="John Doe" 
                icon={<User className="h-4 w-4" />}
                required
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1">Username</label>
              <GlassInput 
                type="text" 
                placeholder="johndoe123" 
                icon={<User className="h-4 w-4" />}
                required
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              />
            </div>
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
            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1">Password</label>
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
              <label className="block text-sm font-medium mb-1.5 ml-1">Confirm Password</label>
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
            {isLoading ? 'Creating account...' : 'Create account'}
          </GlassButton>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
