import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Clock, CheckCircle } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassBadge } from '../../components/ui/GlassBadge';
import { quizService } from '../../services/quizService';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import type { Quiz } from '../../types';

export function StudentQuizzes() {
  const { profile } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attemptMap, setAttemptMap] = useState<Record<string, { status: string, passed: boolean | null }>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!profile?.id) return;
      try {
        const data = await quizService.getMyQuizzes();
        setQuizzes(data);

        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select('quiz_id, status, passed, started_at')
          .eq('student_id', profile.id)
          .order('started_at', { ascending: false });

        if (attempts) {
          const map: Record<string, { status: string, passed: boolean | null }> = {};
          attempts.forEach(attempt => {
            if (!map[attempt.quiz_id]) {
              let finalStatus = attempt.status;
              
              if (finalStatus === 'in_progress') {
                const quiz = data.find(q => q.id === attempt.quiz_id);
                if (quiz?.duration_minutes) {
                  const started = new Date(attempt.started_at).getTime();
                  const elapsed = (Date.now() - started) / (1000 * 60);
                  if (elapsed > quiz.duration_minutes + 1) {
                    finalStatus = 'abandoned';
                  }
                }
              }
              
              map[attempt.quiz_id] = { status: finalStatus, passed: attempt.passed };
            }
          });
          setAttemptMap(map);
        }
      } catch (err) {
        console.error("Error loading quizzes", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [profile]);

  if (isLoading) {
    return (
      <div className="d-flex justify-center items-center" style={{ minHeight: '50vh' }}>
        <div className="animate-spin h-8 w-8 rounded-full" style={{ border: '2px solid var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const groupedQuizzes: Record<string, Quiz[]> = {};
  quizzes.forEach(quiz => {
    // @ts-ignore
    const courseTitle = quiz.courses?.title || 'Unknown Course';
    if (!groupedQuizzes[courseTitle]) {
      groupedQuizzes[courseTitle] = [];
    }
    groupedQuizzes[courseTitle].push(quiz);
  });

  return (
    <div className="d-flex flex-col gap-8">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="dashboard-title text-2xl font-bold">My Quizzes</h1>
        <p className="text-sm text-muted mt-1">View and take quizzes across all your courses.</p>
      </div>

      {quizzes.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <HelpCircle className="mx-auto mb-3 text-muted" style={{ height: '2.5rem', width: '2.5rem', opacity: 0.3 }} />
          <h3 className="font-semibold mb-1">No quizzes available</h3>
          <p className="text-sm text-muted max-w-sm mx-auto">There are no quizzes assigned to you at the moment.</p>
        </GlassCard>
      ) : (
        <div className="d-flex flex-col gap-10">
          {Object.entries(groupedQuizzes).map(([courseTitle, courseQuizzes]) => (
            <div key={courseTitle} className="d-flex flex-col gap-6">
              <div className="d-flex items-center gap-4 pb-4 border-b border-white/5">
                <div className="stat-icon text-primary shadow-sm" style={{ width: '3rem', height: '3rem', borderRadius: '1rem', border: '1px solid rgba(var(--color-primary-rgb), 0.1)' }}>
                  <HelpCircle style={{ height: '1.5rem', width: '1.5rem' }} />
                </div>
                <h2 className="text-xl font-bold tracking-tight">{courseTitle}</h2>
                <GlassBadge className="shadow-sm" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>{courseQuizzes.length} items</GlassBadge>
              </div>

              <div className="dashboard-grid cols-3">
                {courseQuizzes.map((quiz) => {
                  const attemptInfo = attemptMap[quiz.id];
                  const status = attemptInfo?.status || 'not_started';
                  const passed = attemptInfo?.passed;
                  
                  return (
                    <GlassCard key={quiz.id} className="d-flex flex-col p-6 hover-float transition-all">
                      <div className="mb-5">
                        <div className="d-flex justify-between items-start gap-4 mb-4">
                          <h3 className="font-semibold text-base leading-snug tracking-tight" title={quiz.title} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {quiz.title}
                          </h3>
                          <GlassBadge 
                            variant={status === 'cheating_detected' || status === 'abandoned' ? 'danger' : (['graded', 'submitted', 'auto_submitted'].includes(status) ? 'success' : status === 'not_started' ? 'primary' : 'warning')}
                            className="text-xs uppercase font-bold shadow-sm"
                            style={{ flexShrink: 0, alignSelf: 'flex-start' }}
                          >
                            {status === 'cheating_detected' || status === 'abandoned' ? 'Cheating' : (status === 'graded' ? (passed ? 'Passed' : 'Failed') : status.replace('_', ' '))}
                          </GlassBadge>
                        </div>
                        
                        <div className="d-flex flex-col gap-2 text-xs text-muted font-medium">
                          <div className="d-flex items-center gap-2">
                            <Clock style={{ height: '1rem', width: '1rem', opacity: 0.7 }} />
                            <span>{quiz.duration_minutes ? `${quiz.duration_minutes} Minutes` : 'No Time Limit'}</span>
                          </div>
                          <div className="d-flex items-center gap-2">
                            <CheckCircle style={{ height: '1rem', width: '1rem', opacity: 0.7 }} />
                            <span>Passing: {quiz.passing_percentage}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-5 border-t border-white/5 d-flex items-center justify-between gap-4">
                        <span className="text-xs text-muted uppercase tracking-widest font-bold opacity-60">
                          Max: {quiz.max_attempts} attempts
                        </span>
                        <Link to={`/quiz/${quiz.id}`} style={{ textDecoration: 'none' }}>
                          <GlassButton variant={status === 'not_started' ? 'primary' : 'secondary'} size="sm" className="px-5 shadow-sm font-bold">
                            {status === 'not_started' ? 'Start' : 'View'}
                          </GlassButton>
                        </Link>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
