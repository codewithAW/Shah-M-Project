import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase/client';
import { GlassCard } from '../../components/ui/GlassCard';
import { ArrowLeft, BookOpen, CheckSquare, Award } from 'lucide-react';

export function AdminResultDetails() {
  const { studentId } = useParams();
  const [student, setStudent] = useState<any>(null);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (studentId) fetchDetails();
  }, [studentId]);

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch student info
      const { data: studentData, error: studentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;
      setStudent(studentData);

      // Fetch quiz attempts with quiz details
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quizzes:quiz_id (title, max_attempts)
        `)
        .eq('student_id', studentId)
        .not('score', 'is', null)
        .order('created_at', { ascending: false });

      if (quizzesError) throw quizzesError;
      setQuizAttempts(quizzesData || []);

      // Fetch assignment submissions with assignment details
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          assignments:assignment_id (title, max_marks)
        `)
        .eq('student_id', studentId)
        .not('marks', 'is', null)
        .order('submitted_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;
      setAssignmentSubmissions(assignmentsData || []);

    } catch (error) {
      console.error("Error fetching student details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex items-center justify-center h-full p-6">
        <div className="animate-spin h-8 w-8 rounded-full" style={{ border: '4px solid var(--color-primary)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="empty-state">
        <p className="empty-state-desc">Student not found.</p>
        <Link to="/teacher/results" className="d-flex items-center gap-2 mt-4" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
          <ArrowLeft style={{ height: '1rem', width: '1rem' }} /> Back to Results
        </Link>
      </div>
    );
  }

  // Calculate totals
  const bestQuizScores = new Map();
  quizAttempts.forEach(attempt => {
    const currentBest = bestQuizScores.get(attempt.quiz_id) || 0;
    if (attempt.score > currentBest) {
      bestQuizScores.set(attempt.quiz_id, attempt.score);
    }
  });

  let totalQuizMarks = 0;
  bestQuizScores.forEach(score => totalQuizMarks += score);

  let totalAssignmentMarks = 0;
  assignmentSubmissions.forEach(sub => totalAssignmentMarks += (sub.marks || 0));

  const grandTotal = totalQuizMarks + totalAssignmentMarks;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ alignItems: 'center' }}>
        <div className="d-flex items-center gap-5">
          <Link to="/teacher/results" className="btn-icon shadow-sm group" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-muted)' }}>
            <ArrowLeft style={{ height: '1.5rem', width: '1.5rem' }} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="dashboard-title">{student.full_name}</h1>
            <p className="text-sm font-medium text-muted mt-1">Roll: {student.roll_number} | Username: {student.username}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid cols-3">
        <GlassCard className="d-flex items-center gap-5 shadow-sm" style={{ padding: '1.5rem' }}>
          <div className="stat-icon text-primary">
            <CheckSquare style={{ height: '1.75rem', width: '1.75rem' }} />
          </div>
          <div>
            <p className="stat-label">Total Quiz Marks</p>
            <p className="stat-value">{totalQuizMarks}</p>
          </div>
        </GlassCard>
        
        <GlassCard className="d-flex items-center gap-5 shadow-sm" style={{ padding: '1.5rem' }}>
          <div className="stat-icon" style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)' }}>
            <BookOpen style={{ height: '1.75rem', width: '1.75rem' }} />
          </div>
          <div>
            <p className="stat-label">Total Assignment Marks</p>
            <p className="stat-value">{totalAssignmentMarks}</p>
          </div>
        </GlassCard>

        <GlassCard className="d-flex items-center gap-5 shadow-sm" style={{ padding: '1.5rem' }}>
          <div className="stat-icon text-success" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <Award style={{ height: '1.75rem', width: '1.75rem' }} />
          </div>
          <div>
            <p className="stat-label">Grand Total</p>
            <p className="stat-value">{grandTotal}</p>
          </div>
        </GlassCard>
      </div>

      <div className="dashboard-grid cols-2" style={{ flex: 1, minHeight: 0 }}>
        {/* Quizzes Section */}
        <GlassCard className="d-flex flex-col p-6 shadow-sm" style={{ minHeight: 0 }}>
          <h2 className="font-bold text-lg d-flex items-center gap-3 mb-6">
            <div className="stat-icon text-primary" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem' }}><CheckSquare style={{ height: '1.25rem', width: '1.25rem' }} /></div>
            Quiz Attempts
          </h2>
          <div className="d-flex flex-col gap-4" style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
            {quizAttempts.length === 0 ? (
              <p className="text-sm font-medium text-muted text-center py-8">No quiz attempts yet.</p>
            ) : (
              quizAttempts.map((attempt) => {
                const isCheated = attempt.status === 'cheating_detected';
                return (
                  <div key={attempt.id} className="p-4 rounded-xl border border-white/5 transition-all hover-bg-white-10" style={{ background: isCheated ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)', borderColor: isCheated ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)' }}>
                    <div className="d-flex justify-between items-start mb-2">
                      <h3 className="font-bold" style={{ color: isCheated ? 'var(--color-danger)' : 'var(--color-foreground)' }}>{attempt.quizzes?.title || 'Unknown Quiz'}</h3>
                      {isCheated ? (
                        <span className="badge badge-danger">Cheating Detected</span>
                      ) : (
                        <span className="font-bold text-primary text-sm">{attempt.score} marks</span>
                      )}
                    </div>
                    <div className="d-flex justify-between items-center text-xs font-medium" style={{ color: isCheated ? 'var(--color-danger)' : 'var(--color-muted)' }}>
                      <span>Attempt {attempt.attempt_number}</span>
                      <span>{new Date(attempt.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>

        {/* Assignments Section */}
        <GlassCard className="d-flex flex-col p-6 shadow-sm" style={{ minHeight: 0 }}>
          <h2 className="font-bold text-lg d-flex items-center gap-3 mb-6">
            <div className="stat-icon" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', color: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)' }}><BookOpen style={{ height: '1.25rem', width: '1.25rem' }} /></div>
            Assignment Submissions
          </h2>
          <div className="d-flex flex-col gap-4" style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
            {assignmentSubmissions.length === 0 ? (
              <p className="text-sm font-medium text-muted text-center py-8">No graded assignments yet.</p>
            ) : (
              assignmentSubmissions.map((sub) => (
                <div key={sub.id} className="p-4 rounded-xl border border-white/5 transition-all hover-bg-white-10" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="d-flex justify-between items-start mb-2">
                    <h3 className="font-bold">{sub.assignments?.title || 'Unknown Assignment'}</h3>
                    <span className="font-bold text-sm" style={{ color: '#06b6d4' }}>{sub.marks} / {sub.assignments?.max_marks} marks</span>
                  </div>
                  <div className="d-flex justify-between items-center text-xs font-medium text-muted">
                    <span className="badge badge-success">Graded</span>
                    <span>{new Date(sub.submitted_at).toLocaleDateString()}</span>
                  </div>
                  {sub.feedback && (
                    <div className="mt-3 text-sm font-medium p-3 rounded-lg border border-white/5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <span className="text-xs font-bold text-muted block mb-1" style={{ textTransform: 'uppercase' }}>Feedback</span>
                      {sub.feedback}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
