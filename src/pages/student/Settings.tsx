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
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" /> Settings
        </h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <GlassCard className="p-6 md:p-8">
        <h3 className="text-xl font-bold mb-6 border-b border-glass-highlight pb-4">Personal Information</h3>
        
        {profileMessage && (
          <div className={`mb-6 p-3 rounded-xl border text-sm ${profileMessage.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-error/10 border-error/20 text-error'}`}>
            {profileMessage.text}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1">Full Name</label>
              <GlassInput 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1">Email</label>
              <GlassInput 
                type="email" 
                value={profile?.email || ''}
                disabled
                className="opacity-70 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-2 ml-1">Email cannot be changed currently.</p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <GlassButton type="submit" variant="primary" disabled={isUpdatingProfile} className="gap-2">
              <Save className="h-4 w-4" /> {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
            </GlassButton>
          </div>
        </form>
      </GlassCard>

      <GlassCard className="p-6 md:p-8">
        <h3 className="text-xl font-bold mb-6 border-b border-glass-highlight pb-4">Change Password</h3>
        
        {passwordMessage && (
          <div className={`mb-6 p-3 rounded-xl border text-sm ${passwordMessage.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-error/10 border-error/20 text-error'}`}>
            {passwordMessage.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1">New Password</label>
              <GlassInput 
                type="password" 
                icon={<Lock className="h-4 w-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 ml-1">Confirm New Password</label>
              <GlassInput 
                type="password" 
                icon={<Lock className="h-4 w-4" />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <GlassButton type="submit" variant="secondary" disabled={isUpdatingPassword} className="gap-2">
              <Lock className="h-4 w-4" /> {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
