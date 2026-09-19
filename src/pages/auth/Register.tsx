import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, BookOpen, Hash } from 'lucide-react';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassButton } from '../../components/ui/GlassButton';
import { API_BASE } from '../../config';

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
      const response = await fetch(`${API_BASE}/api/auth/register-student`, {
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
    <div className="auth-container">
      {/* Background Orbs */}
      <div className="auth-glow-1"></div>
      <div className="auth-glow-2"></div>

      <div className="glass-card auth-card">
        <div className="auth-header">
          <div className="auth-header-icon">
            <BookOpen style={{ height: '1.5rem', width: '1.5rem' }} />
          </div>
          <h2 className="auth-title">Student Registration</h2>
          <p className="auth-subtitle">Start your learning journey today</p>
        </div>

        {error && (
          <div className="glass-card" style={{ padding: 'var(--space-3)', marginBottom: 'var(--space-6)', backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--color-danger)', textAlign: 'center', fontSize: 'var(--font-size-sm)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="auth-form-group">
              <label className="auth-label">Full Name</label>
              <GlassInput 
                type="text" 
                placeholder="John Doe" 
                icon={<User style={{ height: '1rem', width: '1rem' }} />}
                required
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="auth-form-group">
              <label className="auth-label">Username</label>
              <GlassInput 
                type="text" 
                placeholder="johndoe123" 
                icon={<User style={{ height: '1rem', width: '1rem' }} />}
                required
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              />
            </div>
            <div className="auth-form-group">
              <label className="auth-label">Roll Number</label>
              <GlassInput 
                type="text" 
                placeholder="Ex: 2023CS001" 
                icon={<Hash style={{ height: '1rem', width: '1rem' }} />}
                required
                value={rollNumber}
                onChange={e => setRollNumber(e.target.value.toUpperCase().replace(/\s+/g, ''))}
              />
            </div>
            <div className="auth-form-group">
              <label className="auth-label">Password</label>
              <GlassInput 
                type="password" 
                placeholder="••••••••" 
                icon={<Lock style={{ height: '1rem', width: '1rem' }} />}
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div className="auth-form-group">
              <label className="auth-label">Confirm Password</label>
              <GlassInput 
                type="password" 
                placeholder="••••••••" 
                icon={<Lock style={{ height: '1rem', width: '1rem' }} />}
                required
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <GlassButton variant="primary" style={{ width: '100%', height: '3rem' }} type="submit" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create account'}
          </GlassButton>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-primary)', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
