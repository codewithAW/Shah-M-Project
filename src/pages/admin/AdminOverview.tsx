import { useState, useEffect } from 'react';
import { Users, Book, Activity, ArrowUpRight, BarChart } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAuth } from '../../hooks/useAuth';
import { analyticsService } from '../../services/analyticsService';

export function AdminOverview() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ totalCourses: 0, totalStudents: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (profile?.id) {
        try {
          const overview = await analyticsService.getTeacherOverview(profile.id);
          setStats(overview);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    }
    loadStats();
  }, [profile]);

  if (isLoading) return <div className="flex justify-center p-20"><div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="dashboard-container">
      {/* Stats Grid */}
      <div className="dashboard-grid cols-4">
        {[
          { title: 'Total Courses', value: stats.totalCourses.toString(), icon: Book, color: 'text-primary', bg: 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/10', trend: 'Live' },
          { title: 'Active Students', value: stats.totalStudents.toString(), icon: Users, color: 'text-success', bg: 'bg-gradient-to-br from-success/20 to-success/5 border-success/10', trend: 'Live' },
          { title: 'Teacher Dashboard', value: 'Active', icon: Activity, color: 'text-warning', bg: 'bg-gradient-to-br from-warning/20 to-warning/5 border-warning/10', trend: 'System' },
          { title: 'Analytics', value: 'Ready', icon: BarChart, color: 'text-cyan-500', bg: 'bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border-cyan-500/10', trend: 'System' },
        ].map((stat, i) => (
          <GlassCard key={i} className="stat-card group">
            <div className="stat-card-header">
              <div>
                <p className="stat-card-title">{stat.title}</p>
                <h3 className="stat-card-value">{stat.value}</h3>
              </div>
              <div className={`stat-card-icon ${stat.bg} ${stat.color}`}>
                <stat.icon style={{ height: '1.5rem', width: '1.5rem' }} />
              </div>
            </div>
            <div className="stat-card-footer">
              <span className="text-success d-flex items-center" style={{ fontWeight: 'var(--font-weight-bold)' }}>
                <ArrowUpRight style={{ height: '1rem', width: '1rem', marginRight: '0.25rem' }} />
                {stat.trend}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="dashboard-grid cols-3" style={{ marginTop: 'var(--space-8)' }}>
        <div style={{ gridColumn: 'span 2 / span 2' }}>
          <GlassCard className="dashboard-panel">
            <div className="dashboard-panel-header">
              <h3 className="dashboard-panel-title">Platform Overview</h3>
            </div>
            <div className="dashboard-panel-content">
              <BarChart style={{ height: '4rem', width: '4rem', margin: '0 auto var(--space-4)', opacity: 0.3 }} />
              <p style={{ fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-lg)', color: 'var(--color-foreground)' }}>Welcome to the Teacher Analytics Dashboard.</p>
              <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-2)', fontWeight: 'var(--font-weight-medium)' }}>More detailed analytics are available inside individual Course views.</p>
            </div>
          </GlassCard>
        </div>
        
        <div style={{ gridColumn: 'span 1 / span 1' }}>
          <GlassCard className="dashboard-panel" style={{ background: 'linear-gradient(to bottom right, rgba(99,102,241,0.1), rgba(6,182,212,0.05))' }}>
            <h3 className="dashboard-panel-title" style={{ marginBottom: 'var(--space-6)' }}>Quick Actions</h3>
            <div className="d-flex flex-col gap-4">
              <button className="action-button group">
                <div className="action-button-glow"></div>
                <span className="action-button-text">Generate Quiz with AI</span>
                <ArrowUpRight className="action-button-icon" style={{ height: '1.25rem', width: '1.25rem' }} />
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
