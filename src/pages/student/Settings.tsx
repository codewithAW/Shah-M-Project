import { useState } from 'react';
import { Settings as SettingsIcon, Save, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase/client';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassButton } from '../../components/ui/GlassButton';

export function Settings() {
  const { profile, user, refreshProfile } = useAuth();
  
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user?.id);

      if (error) throw error;
      
      await refreshProfile();
      setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: any) {
      console.error(err);
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    setPasswordMessage(null);

    if (password !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: "Passwords do not match." });
      setIsUpdatingPassword(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
    } catch (err: any) {
      console.error(err);
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="d-flex flex-col gap-8" style={{ maxWidth: '48rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="dashboard-title text-3xl font-extrabold mb-2 d-flex items-center gap-4 tracking-tight">
          <div className="stat-icon text-primary shadow-sm" style={{ width: '3rem', height: '3rem', borderRadius: '1rem', border: '1px solid rgba(var(--color-primary-rgb), 0.1)' }}>
            <SettingsIcon style={{ height: '1.5rem', width: '1.5rem' }} />
          </div>
          Settings
        </h1>
        <p className="text-muted font-medium">Manage your account settings and preferences.</p>
      </div>

      <GlassCard className="p-8">
        <h3 className="text-xl font-bold mb-6 pb-4 tracking-tight" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Personal Information</h3>
        
        {profileMessage && (
          <div className="p-4 rounded-xl text-sm font-medium shadow-sm mb-6" style={profileMessage.type === 'success' ? { background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.2)' } : { background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {profileMessage.text}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="d-flex flex-col gap-6">
          <div className="d-flex flex-col gap-6">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name</label>
              <GlassInput 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email</label>
              <GlassInput 
                type="email" 
                value={profile?.email || ''}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed', background: 'rgba(0,0,0,0.05)' }}
              />
              <p className="text-xs font-medium text-muted mt-2 ml-1 opacity-80">Email cannot be changed currently.</p>
            </div>
          </div>
          
          <div className="d-flex justify-end pt-4">
            <GlassButton type="submit" variant="primary" disabled={isUpdatingProfile} className="px-6 shadow-sm font-bold d-flex items-center gap-2">
              <Save style={{ height: '1rem', width: '1rem' }} /> {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
            </GlassButton>
          </div>
        </form>
      </GlassCard>

      <GlassCard className="p-8">
        <h3 className="text-xl font-bold mb-6 pb-4 tracking-tight" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Change Password</h3>
        
        {passwordMessage && (
          <div className="p-4 rounded-xl text-sm font-medium shadow-sm mb-6" style={passwordMessage.type === 'success' ? { background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.2)' } : { background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {passwordMessage.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="d-flex flex-col gap-6">
          <div className="dashboard-grid cols-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">New Password</label>
              <GlassInput 
                type="password" 
                icon={<Lock style={{ height: '1rem', width: '1rem' }} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Confirm New Password</label>
              <GlassInput 
                type="password" 
                icon={<Lock style={{ height: '1rem', width: '1rem' }} />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>
          
          <div className="d-flex justify-end pt-4">
            <GlassButton type="submit" variant="secondary" disabled={isUpdatingPassword} className="px-6 shadow-sm font-bold d-flex items-center gap-2">
              <Lock style={{ height: '1rem', width: '1rem' }} /> {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
