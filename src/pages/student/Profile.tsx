import { UserCircle, Mail, Shield, BookOpen } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassBadge } from '../../components/ui/GlassBadge';

export function Profile() {
  const { profile, user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-muted-foreground">Manage your public presence and academic identity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <GlassCard className="p-8 flex flex-col items-center text-center">
            <div className="h-32 w-32 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-6 border-4 border-background shadow-xl">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full rounded-full object-cover" />
              ) : (
                <UserCircle className="h-16 w-16" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-1">{profile?.full_name || 'Loading...'}</h2>
            <p className="text-muted-foreground mb-4">{profile?.email || user?.email}</p>
            <GlassBadge variant={profile?.role === 'teacher' ? 'success' : 'primary'} className="uppercase tracking-widest text-xs px-4 py-1">
              {profile?.role || 'student'}
            </GlassBadge>
          </GlassCard>
        </div>

        <div className="md:col-span-2 space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Academic Information
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-glass-highlight">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-foreground">Active</span>
              </div>
              <div className="flex justify-between py-3 border-b border-glass-highlight">
                <span className="text-muted-foreground">Enrolled Since</span>
                <span className="font-medium text-foreground">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Account Security
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-glass-highlight">
                <span className="text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4" /> Email Address</span>
                <span className="font-medium text-foreground">{user?.email}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
