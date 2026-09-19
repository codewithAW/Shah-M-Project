import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle, Activity, Bell, Clock } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { CourseCard } from '../../components/ui/CourseCard';
import { useAuth } from '../../hooks/useAuth';
import { enrollmentService } from '../../services/enrollmentService';
import { progressService } from '../../services/progressService';
import { notificationService } from '../../services/notificationService';
import type { Enrollment, StudentActivity, AppNotification } from '../../types';

export function Dashboard() {
  const { profile } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courseProgressMap, setCourseProgressMap] = useState<Record<string, number>>({});
  const [activities, setActivities] = useState<StudentActivity[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [completedLecturesCount, setCompletedLecturesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!profile?.id) return;
      try {
        const [data, recentActs, unreadNotifs] = await Promise.all([
          enrollmentService.getMyEnrollments(),
          progressService.getRecentActivity(profile.id, 5),
          notificationService.getNotifications(profile.id, true)
        ]);
        
        setEnrollments(data);
        setActivities(recentActs);
        setNotifications(unreadNotifs.slice(0, 5));

        const courses = data.map(e => (e as any).courses).filter(Boolean);
        const pMap: Record<string, number> = {};
        let totalCompleted = 0;
        
        for (const course of courses) {
          const prog = await progressService.getCourseProgress(profile.id, course.id);
          pMap[course.id] = prog.percentage;
          totalCompleted += prog.completed;
        }
        
        setCourseProgressMap(pMap);
        setCompletedLecturesCount(totalCompleted);

      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [profile]);

  const enrolledCourses = enrollments.map(e => (e as any).courses).filter(Boolean);

  if (isLoading) return (
    <div className="d-flex justify-center items-center" style={{ minHeight: '50vh' }}>
      <div className="animate-spin h-8 w-8 rounded-full" style={{ border: '2px solid var(--color-primary)', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="d-flex flex-col gap-8">
      
      {/* Welcome Header */}
      <div className="dashboard-container relative overflow-hidden p-8 md-p-10">
        {/* Subtle background accent */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'rgba(var(--color-primary-rgb), 0.15)', filter: 'blur(80px)', transform: 'translate(25%, -50%)' }} />
        <div className="absolute bottom-0 left-10 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'rgba(6, 182, 212, 0.1)', filter: 'blur(60px)', transform: 'translateY(50%)' }} />
        
        <div className="d-flex flex-col md-flex-row justify-between items-start md-items-center gap-6 relative" style={{ zIndex: 10 }}>
          <div className="d-flex items-center gap-6">
            <div className="stat-icon shadow-sm" style={{ width: '5rem', height: '5rem', borderRadius: '1.5rem', background: 'linear-gradient(to bottom right, rgba(var(--color-primary-rgb), 0.2), rgba(var(--color-primary-rgb), 0.05))', color: 'var(--color-primary)', fontSize: '1.875rem', fontWeight: 700, border: '2px solid var(--color-primary)', overflow: 'hidden', flexShrink: 0 }}>
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : (profile?.full_name?.substring(0, 2).toUpperCase() || 'S')}
            </div>
            <div>
              <p className="text-sm font-medium tracking-wide uppercase mb-1 text-muted">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}</p>
              <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontSize: '2.25rem', lineHeight: '2.5rem' }}>{profile?.full_name || 'Student'} 👋</h1>
              <p className="text-base text-muted mt-2 leading-relaxed" style={{ maxWidth: '32rem' }}>
                {completedLecturesCount > 0 ? `Keep going! Your efforts are building a better future.` : "Ready to start your learning journey? Explore our courses to begin."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="dashboard-grid cols-3">
        {[
          { icon: BookOpen, label: 'Overall Average', value: '—', sublabel: 'Across graded assignments', color: 'var(--color-primary)', bg: 'linear-gradient(to bottom right, rgba(var(--color-primary-rgb), 0.2), rgba(var(--color-primary-rgb), 0.05))', border: '1px solid rgba(var(--color-primary-rgb), 0.1)' },
          { icon: CheckCircle, label: 'Completed', value: completedLecturesCount, sublabel: 'Assignments finished', color: 'var(--color-success)', bg: 'linear-gradient(to bottom right, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))', border: '1px solid rgba(16, 185, 129, 0.1)' },
          { icon: Clock, label: 'Pending Review', value: activities.length, sublabel: 'Waiting grading', color: 'var(--color-warning)', bg: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05))', border: '1px solid rgba(245, 158, 11, 0.1)' },
        ].map((stat, i) => (
          <GlassCard key={i} className="d-flex items-center gap-4 p-6 hover-float transition-all">
            <div className="stat-icon shadow-sm" style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1rem', background: stat.bg, color: stat.color, border: stat.border, flexShrink: 0 }}>
              <stat.icon style={{ height: '1.5rem', width: '1.5rem' }} />
            </div>
            <div className="d-flex items-center gap-3">
              <span className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stat.value}</span>
              <span className="stat-label text-muted font-bold">{stat.sublabel}</span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid cols-3">
        {/* Left: Courses & Recent */}
        <div style={{ gridColumn: 'span 2 / span 2' }} className="d-flex flex-col gap-6">
          {/* My Courses */}
          <section>
            <div className="d-flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">My Courses</h2>
              <Link to="/courses" className="text-sm font-medium text-primary" style={{ textDecoration: 'none' }}>Browse All</Link>
            </div>
            
            {enrolledCourses.length === 0 ? (
              <GlassCard className="p-10 text-center">
                <BookOpen className="mx-auto mb-4 text-muted" style={{ height: '2.5rem', width: '2.5rem', opacity: 0.3 }} />
                <h3 className="font-semibold mb-1">No active enrollments</h3>
                <p className="text-sm text-muted mb-4">Explore our catalog to get started.</p>
                <Link to="/courses" style={{ textDecoration: 'none' }}>
                  <GlassButton variant="primary" size="sm">Explore Catalog</GlassButton>
                </Link>
              </GlassCard>
            ) : (
              <div className="dashboard-grid cols-2">
                {enrolledCourses.map(course => (
                  <CourseCard key={course.id} course={course} progressPercentage={courseProgressMap[course.id] || 0} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="d-flex flex-col gap-6">
          {/* Recent Activity */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="d-flex flex-col gap-3">
              {activities.length === 0 ? (
                <GlassCard className="p-6 text-center">
                  <Activity className="mx-auto mb-2 text-muted" style={{ height: '2rem', width: '2rem', opacity: 0.3 }} />
                  <p className="text-sm text-muted">No recent activity.</p>
                </GlassCard>
              ) : (
                activities.map(act => (
                  <GlassCard key={act.id} className="p-4 d-flex gap-3 items-start">
                    <div className="stat-icon text-primary" style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem', background: 'rgba(var(--color-primary-rgb), 0.1)', flexShrink: 0 }}>
                      <Activity style={{ height: '1rem', width: '1rem' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium capitalize" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.activity_type.replace('_', ' ')}</p>
                      <p className="text-xs text-muted mt-1">
                        {new Date(act.created_at).toLocaleDateString()} at {new Date(act.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </GlassCard>
                ))
              )}
            </div>
          </section>

          {/* Notifications */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Notifications</h2>
            <div className="d-flex flex-col gap-3">
              {notifications.length === 0 ? (
                <GlassCard className="p-6 text-center">
                  <Bell className="mx-auto mb-2 text-muted" style={{ height: '2rem', width: '2rem', opacity: 0.3 }} />
                  <p className="text-sm text-muted">You're all caught up!</p>
                </GlassCard>
              ) : (
                notifications.map(notif => (
                  <GlassCard key={notif.id} className="p-4">
                    <h4 className="text-sm font-medium mb-1">{notif.title}</h4>
                    <p className="text-xs text-muted leading-relaxed mb-2">{notif.message}</p>
                    {notif.link && (
                      <Link to={notif.link} className="text-xs font-medium text-primary" style={{ textDecoration: 'none' }}>
                        View details →
                      </Link>
                    )}
                  </GlassCard>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
