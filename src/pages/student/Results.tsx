import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, FileText, XCircle, Loader2, BookOpen } from 'lucide-react';
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
          resource_id: a.quiz_id,
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
          resource_id: s.assignment_id,
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
      <div className="d-flex justify-center items-center" style={{ minHeight: '50vh' }}>
        <Loader2 className="animate-spin text-primary" style={{ height: '2rem', width: '2rem', opacity: 0.5 }} />
      </div>
    );
  }

  // Compute stats
  const graded = results.filter(r => r.percentage !== null);
  const avgPercentage = graded.length > 0 ? Math.round(graded.reduce((acc, r) => acc + r.percentage, 0) / graded.length) : 0;
  const completedCount = graded.length;
  const pendingCount = results.filter(r => r.percentage === null).length;

  return (
    <div className="d-flex flex-col gap-8">
      {/* Page Header */}
      <div>
        <h1 className="dashboard-title text-2xl font-bold">Results</h1>
        <p className="text-muted text-sm mt-1">Track your academic performance across all assessments.</p>
      </div>

      {/* Stats Row */}
      <div className="dashboard-grid cols-3 mb-8">
        <GlassCard className="p-6 d-flex flex-row items-center gap-4 hover-float transition-all">
          <div className="d-flex items-center justify-center shrink-0" style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', border: '1px solid rgba(var(--color-primary-rgb), 0.1)', color: 'var(--color-primary)' }}>
            <BookOpen style={{ height: '1.25rem', width: '1.25rem' }} />
          </div>
          <div className="d-flex items-center gap-3">
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{graded.length > 0 ? `${avgPercentage}%` : '—'}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', lineHeight: 1.3 }}>Across graded<br/>assignments</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6 d-flex flex-row items-center gap-4 hover-float transition-all">
          <div className="d-flex items-center justify-center shrink-0" style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', background: '#ecfdf5', color: '#10b981' }}>
            <CheckCircle2 style={{ height: '1.25rem', width: '1.25rem' }} />
          </div>
          <div className="d-flex items-center gap-3">
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{completedCount}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Assignments finished</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6 d-flex flex-row items-center gap-4 hover-float transition-all">
          <div className="d-flex items-center justify-center shrink-0" style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', background: '#fffbeb', color: '#f59e0b' }}>
            <Clock style={{ height: '1.25rem', width: '1.25rem' }} />
          </div>
          <div className="d-flex items-center gap-3">
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{pendingCount}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>Waiting grading</span>
          </div>
        </GlassCard>
      </div>

      {/* Assessment List */}
      <section>
        <h2 className="text-xl font-bold mb-6 tracking-tight">Recent Assessments</h2>

        {results.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <FileText className="mx-auto mb-4 text-muted" style={{ height: '3rem', width: '3rem', opacity: 0.3 }} />
            <h3 className="font-semibold text-lg mb-2">No History Found</h3>
            <p className="text-base text-muted max-w-md mx-auto leading-relaxed">
              You haven't completed any assessments yet. Check your dashboard to see upcoming assignments and quizzes.
            </p>
          </GlassCard>
        ) : (
          <div className="d-flex flex-col gap-4">
            {results.map(result => {
              const isQuiz = result.type === 'quiz';
              
              return (
                <Link key={result.id + result.type} to={`/${result.type}/${result.resource_id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <GlassCard className="p-6 hover-float transition-all">
                    <div className="d-flex flex-wrap items-center gap-5">
                      {/* Left: Type + Title */}
                      <div className="d-flex items-center gap-4 min-w-0" style={{ flex: '1 1 40%' }}>
                        <div className="stat-icon shadow-sm" style={{ width: '3rem', height: '3rem', borderRadius: '1rem', border: `1px solid ${isQuiz ? 'rgba(var(--color-primary-rgb), 0.1)' : 'rgba(6, 182, 212, 0.1)'}`, background: isQuiz ? 'linear-gradient(to bottom right, rgba(var(--color-primary-rgb), 0.2), rgba(var(--color-primary-rgb), 0.05))' : 'linear-gradient(to bottom right, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.05))', color: isQuiz ? 'var(--color-primary)' : 'rgb(6, 182, 212)' }}>
                          {isQuiz ? <CheckCircle2 style={{ height: '1.5rem', width: '1.5rem' }} /> : <FileText style={{ height: '1.5rem', width: '1.5rem' }} />}
                        </div>
                        <div className="min-w-0">
                          <div className="d-flex items-center gap-2 mb-1">
                            <GlassBadge variant={isQuiz ? 'primary' : 'default'} className="text-xs uppercase font-bold tracking-wider shadow-sm">
                              {result.type}
                            </GlassBadge>
                          </div>
                          <p className="font-bold text-base tracking-tight" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{result.title}</p>
                          <p className="text-xs font-medium text-muted mt-1 opacity-80">
                            {new Date(result.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>

                      {/* Center: Status */}
                      <div className="d-flex items-center" style={{ flex: '1 1 20%', minWidth: '150px' }}>
                        {result.percentage !== null ? (
                          result.passed === true ? (
                            <GlassBadge variant="success" className="font-bold shadow-sm d-flex items-center gap-1"><CheckCircle2 style={{ width: '0.875rem', height: '0.875rem' }}/> Passed</GlassBadge>
                          ) : result.passed === false ? (
                            <GlassBadge variant="danger" className="font-bold shadow-sm d-flex items-center gap-1"><XCircle style={{ width: '0.875rem', height: '0.875rem' }}/> Failed</GlassBadge>
                          ) : (
                            <GlassBadge variant="success" className="font-bold shadow-sm d-flex items-center gap-1"><CheckCircle2 style={{ width: '0.875rem', height: '0.875rem' }}/> Graded</GlassBadge>
                          )
                        ) : (
                          <GlassBadge variant="warning" className="font-bold shadow-sm d-flex items-center gap-1"><Clock style={{ width: '0.875rem', height: '0.875rem' }}/> Pending</GlassBadge>
                        )}
                      </div>

                      {/* Right: Score */}
                      <div className="d-flex justify-end" style={{ flex: '1 1 30%', minWidth: '150px' }}>
                        {result.percentage !== null ? (
                          <div className="d-flex items-baseline gap-2">
                            <span className="font-extrabold tracking-tight" style={{ fontSize: '1.875rem', lineHeight: '2.25rem' }}>{Math.round(result.percentage)}%</span>
                            <span className="text-sm font-medium text-muted tracking-widest uppercase opacity-70">
                              {result.score}/{result.type === 'quiz' ? '100' : result.max_marks} pts
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted">Awaiting grade</span>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
