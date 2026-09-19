import { UserCircle, Mail, Shield, BookOpen } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassBadge } from '../../components/ui/GlassBadge';

export function Profile() {
  const { profile, user } = useAuth();

  return (
    <div className="d-flex flex-col gap-8" style={{ maxWidth: '56rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="dashboard-title text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-muted">Manage your public presence and academic identity.</p>
      </div>

      <div className="dashboard-grid cols-3">
        <div style={{ gridColumn: 'span 1 / span 1' }}>
          <GlassCard className="p-8 d-flex flex-col items-center text-center">
            <div className="relative" style={{ marginBottom: '1.5rem' }}>
              <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(var(--color-primary-rgb), 0.2)', filter: 'blur(20px)', transform: 'translateY(0.5rem)' }}></div>
              <div className="relative rounded-full d-flex items-center justify-center text-primary shadow-sm" style={{ width: '9rem', height: '9rem', background: 'linear-gradient(to bottom right, rgba(var(--color-primary-rgb), 0.2), rgba(var(--color-primary-rgb), 0.05))', border: '6px solid rgba(255,255,255,0.1)', zIndex: 10 }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} style={{ height: '100%', width: '100%', borderRadius: '9999px', objectFit: 'cover' }} />
                ) : (
                  <UserCircle style={{ height: '4rem', width: '4rem' }} />
                )}
              </div>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-1">{profile?.full_name || 'Loading...'}</h2>
            <p className="text-sm font-medium text-muted mb-6">{profile?.email || user?.email}</p>
            <GlassBadge variant={profile?.role === 'teacher' ? 'success' : 'primary'} className="uppercase tracking-widest text-xs font-bold shadow-sm" style={{ padding: '0.375rem 1.25rem' }}>
              {profile?.role || 'student'}
            </GlassBadge>
          </GlassCard>
        </div>

        <div className="d-flex flex-col gap-6" style={{ gridColumn: 'span 2 / span 2' }}>
          <GlassCard className="p-8">
            <h3 className="text-xl font-bold mb-6 d-flex items-center gap-3 tracking-tight">
              <div className="stat-icon text-primary shadow-sm" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.8rem', background: 'linear-gradient(to bottom right, rgba(var(--color-primary-rgb), 0.2), rgba(var(--color-primary-rgb), 0.05))', border: '1px solid rgba(var(--color-primary-rgb), 0.1)' }}>
                <BookOpen style={{ height: '1.25rem', width: '1.25rem' }} />
              </div>
              Academic Information
            </h3>
            <div className="d-flex flex-col gap-4">
              <div className="d-flex justify-between py-4 border-b border-white/5">
                <span className="text-muted font-medium">Status</span>
                <GlassBadge variant="success" className="font-bold shadow-sm">Active</GlassBadge>
              </div>
              <div className="d-flex justify-between py-4 border-b border-white/5">
                <span className="text-muted font-medium">Enrolled Since</span>
                <span className="font-bold">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-8">
            <h3 className="text-xl font-bold mb-6 d-flex items-center gap-3 tracking-tight">
              <div className="stat-icon shadow-sm" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.8rem', background: 'linear-gradient(to bottom right, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.05))', color: 'rgb(6, 182, 212)', border: '1px solid rgba(6, 182, 212, 0.1)' }}>
                <Shield style={{ height: '1.25rem', width: '1.25rem' }} />
              </div>
              Account Security
            </h3>
            <div className="d-flex flex-col gap-4">
              <div className="d-flex justify-between py-4 border-b border-white/5">
                <span className="text-muted font-medium d-flex items-center gap-2"><Mail style={{ height: '1rem', width: '1rem', opacity: 0.7 }} /> Email Address</span>
                <span className="font-bold">{user?.email}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
