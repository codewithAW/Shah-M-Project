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
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Courses', value: stats.totalCourses.toString(), icon: Book, color: 'text-primary', bg: 'bg-primary/10', trend: 'Live' },
          { title: 'Active Students', value: stats.totalStudents.toString(), icon: Users, color: 'text-success', bg: 'bg-success/10', trend: 'Live' },
          { title: 'Teacher Dashboard', value: 'Active', icon: Activity, color: 'text-warning', bg: 'bg-warning/10', trend: 'System' },
          { title: 'Analytics', value: 'Ready', icon: BarChart, color: 'text-accent', bg: 'bg-accent/10', trend: 'System' },
        ].map((stat, i) => (
          <GlassCard key={i} className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-3xl font-bold mt-2">{stat.value}</h3>
              </div>
              <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-success flex items-center font-medium">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                {stat.trend}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2">
          <GlassCard className="p-6 h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Platform Overview</h3>
            </div>
            <div className="p-8 text-center text-muted-foreground bg-glass/20 rounded-xl border border-glass-highlight">
              <BarChart className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Welcome to the Teacher Analytics Dashboard.</p>
              <p className="text-sm mt-2">More detailed analytics are available inside individual Course views.</p>
            </div>
          </GlassCard>
        </div>
        
        <div className="lg:col-span-1">
          <GlassCard className="p-6 h-full bg-gradient-to-br from-primary/5 to-accent/5">
            <h3 className="text-lg font-bold mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 rounded-xl bg-background/50 border border-glass-highlight hover:border-primary hover:bg-glass transition-colors text-sm font-medium flex items-center justify-between group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Generate Quiz with AI</span>
                <ArrowUpRight className="h-4 w-4 text-accent transition-colors" />
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
