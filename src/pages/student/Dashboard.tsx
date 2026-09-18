import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, BookOpen, CheckCircle, Activity, Bell, GraduationCap, Clock } from 'lucide-react';
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
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-8">
      
      {/* Welcome Header */}
      <GlassCard className="relative overflow-hidden p-8">
        {/* Subtle background accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary overflow-hidden shrink-0">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover"/> : (profile?.full_name?.substring(0, 2).toUpperCase() || 'S')}
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},</p>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{profile?.full_name || 'Student'} 👋</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {completedLecturesCount > 0 ? `Keep going! Your efforts are building a better future.` : "Ready to start your learning journey?"}
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: BookOpen, label: 'Overall Average', value: '—', sublabel: 'Across graded assessments', color: 'text-primary', bg: 'bg-primary/10' },
          { icon: CheckCircle, label: 'Completed', value: completedLecturesCount, sublabel: 'Assessments finished', color: 'text-success', bg: 'bg-success/10' },
          { icon: Clock, label: 'Pending Review', value: activities.length, sublabel: 'Waiting grading', color: 'text-warning', bg: 'bg-warning/10' },
        ].map((stat, i) => (
          <GlassCard key={i} className="flex items-center gap-4 p-5">
            <div className={`h-12 w-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-medium">{stat.sublabel}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Courses & Recent */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Courses */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">My Courses</h2>
              <Link to="/courses" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">Browse All</Link>
            </div>
            
            {enrolledCourses.length === 0 ? (
              <GlassCard className="p-10 text-center">
                <BookOpen className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="font-semibold mb-1">No active enrollments</h3>
                <p className="text-sm text-muted-foreground mb-4">Explore our catalog to get started.</p>
                <Link to="/courses">
                  <GlassButton variant="primary" size="sm">Explore Catalog</GlassButton>
                </Link>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrolledCourses.map(course => (
                  <CourseCard key={course.id} course={course} progressPercentage={courseProgressMap[course.id] || 0} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {activities.length === 0 ? (
                <GlassCard className="p-6 text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No recent activity.</p>
                </GlassCard>
              ) : (
                activities.map(act => (
                  <GlassCard key={act.id} className="p-4 flex gap-3 items-start">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium capitalize truncate">{act.activity_type.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
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
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <GlassCard className="p-6 text-center">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">You're all caught up!</p>
                </GlassCard>
              ) : (
                notifications.map(notif => (
                  <GlassCard key={notif.id} className="p-4">
                    <h4 className="text-sm font-medium mb-1">{notif.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{notif.message}</p>
                    {notif.link && (
                      <Link to={notif.link} className="text-xs font-medium text-primary hover:text-primary/80">
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
