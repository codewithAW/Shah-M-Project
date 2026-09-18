import { useState, useEffect } from 'react';
import { Award, CheckCircle2, Clock, FileText, XCircle, Loader2 } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassBadge } from '../../components/ui/GlassBadge';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../hooks/useAuth';

export function Results() {
  const { profile } = useAuth();
  
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile) loadData();
  }, [profile]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: attempts, error: aErr } = await supabase
        .from('quiz_attempts')
        .select('*, quizzes(title, max_attempts)')
        .eq('student_id', profile!.id)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false });
        
      if (aErr) throw aErr;

      const { data: submissions, error: sErr } = await supabase
        .from('assignment_submissions')
        .select('*, assignments(title, max_marks)')
        .eq('student_id', profile!.id)
        .order('submitted_at', { ascending: false });
        
      if (sErr) throw sErr;

      const combined = [
        ...(attempts || []).map(a => ({
          id: a.id,
          type: 'quiz',
          title: a.quizzes?.title,
          date: a.submitted_at,
          score: a.score,
          percentage: a.percentage,
          status: 'graded', 
          passed: a.passed
        })),
        ...(submissions || []).map(s => ({
          id: s.id,
          type: 'assignment',
          title: s.assignments?.title,
          date: s.submitted_at,
          score: s.marks,
          max_marks: s.assignments?.max_marks,
          percentage: s.marks !== null ? (s.marks / (s.assignments?.max_marks || 100)) * 100 : null,
          status: s.status,
          feedback: s.feedback
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setResults(combined);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  // Compute stats
  const graded = results.filter(r => r.percentage !== null);
  const avgPercentage = graded.length > 0 ? Math.round(graded.reduce((acc, r) => acc + r.percentage, 0) / graded.length) : 0;
  const completedCount = graded.length;
  const pendingCount = results.filter(r => r.percentage === null).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Results</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your academic performance across all assessments.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{avgPercentage}%</p>
            <p className="text-xs text-muted-foreground">Overall Average</p>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </div>
        </GlassCard>
      </div>

      {/* Assessment List */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Recent Assessments</h2>

        {results.length === 0 ? (
          <GlassCard className="p-10 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="font-semibold mb-1">No History Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              You haven't completed any assessments yet. Check your dashboard to see upcoming assignments and quizzes.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {results.map(result => {
              const isQuiz = result.type === 'quiz';
              
              return (
                <GlassCard key={result.id + result.type} className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Left: Type + Title */}
                    <div className="flex items-center gap-3 sm:w-5/12 min-w-0">
                      <div className={`h-10 w-10 rounded-xl shrink-0 flex items-center justify-center ${isQuiz ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                        {isQuiz ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <GlassBadge variant={isQuiz ? 'primary' : 'default'} className="text-[10px] uppercase">
                            {result.type}
                          </GlassBadge>
                        </div>
                        <p className="font-medium text-sm truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(result.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>

                    {/* Center: Status */}
                    <div className="sm:w-3/12 flex items-center">
                      {result.percentage !== null ? (
                        result.passed === true ? (
                          <GlassBadge variant="success"><CheckCircle2 className="w-3 h-3"/> Passed</GlassBadge>
                        ) : result.passed === false ? (
                          <GlassBadge variant="error"><XCircle className="w-3 h-3"/> Failed</GlassBadge>
                        ) : (
                          <GlassBadge variant="success"><CheckCircle2 className="w-3 h-3"/> Graded</GlassBadge>
                        )
                      ) : (
                        <GlassBadge variant="warning"><Clock className="w-3 h-3"/> Pending</GlassBadge>
                      )}
                    </div>

                    {/* Right: Score */}
                    <div className="sm:w-4/12 flex sm:justify-end">
                      {result.percentage !== null ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">{Math.round(result.percentage)}%</span>
                          <span className="text-xs text-muted-foreground">
                            {result.score}/{result.type === 'quiz' ? '100' : result.max_marks} pts
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Awaiting grade</span>
                      )}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
