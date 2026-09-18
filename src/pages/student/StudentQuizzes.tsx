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
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
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
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">My Quizzes</h1>
        <p className="text-sm text-muted-foreground mt-1">View and take quizzes across all your courses.</p>
      </div>

      {quizzes.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <HelpCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="font-semibold mb-1">No quizzes available</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">There are no quizzes assigned to you at the moment.</p>
        </GlassCard>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedQuizzes).map(([courseTitle, courseQuizzes]) => (
            <div key={courseTitle} className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-semibold">{courseTitle}</h2>
                <GlassBadge>{courseQuizzes.length} items</GlassBadge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courseQuizzes.map((quiz) => {
                  const attemptInfo = attemptMap[quiz.id];
                  const status = attemptInfo?.status || 'not_started';
                  const passed = attemptInfo?.passed;
                  
                  return (
                    <GlassCard key={quiz.id} className="p-5 flex flex-col">
                      <div className="mb-4">
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <h3 className="font-semibold text-sm leading-snug line-clamp-2" title={quiz.title}>
                            {quiz.title}
                          </h3>
                          <GlassBadge 
                            variant={status === 'cheating_detected' || status === 'abandoned' ? 'error' : (['graded', 'submitted', 'auto_submitted'].includes(status) ? 'success' : status === 'not_started' ? 'primary' : 'warning')}
                            className="text-[10px] uppercase shrink-0"
                          >
                            {status === 'cheating_detected' || status === 'abandoned' ? 'Cheating' : (status === 'graded' ? (passed ? 'Passed' : 'Failed') : status.replace('_', ' '))}
                          </GlassBadge>
                        </div>
                        
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span>{quiz.duration_minutes ? `${quiz.duration_minutes} Minutes` : 'No Time Limit'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>Passing: {quiz.passing_percentage}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-border flex items-center justify-between gap-3">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Max: {quiz.max_attempts} attempts
                        </span>
                        <Link to={`/quiz/${quiz.id}`}>
                          <GlassButton variant={status === 'not_started' ? 'primary' : 'secondary'} size="sm">
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
