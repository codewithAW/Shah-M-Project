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
      <div className="h-full flex items-center justify-center p-6">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-muted-foreground">
        <p>Student not found.</p>
        <Link to="/teacher/results" className="mt-4 text-primary hover:underline flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Results
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
    <div className="h-full flex flex-col p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/teacher/results" className="p-2 rounded-xl bg-glass hover:bg-glass/80 transition-colors text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{student.full_name}</h1>
          <p className="text-muted-foreground mt-1">Roll: {student.roll_number} | Username: {student.username}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6 flex items-center gap-4 border-primary/20 bg-primary/5">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Quiz Marks</p>
            <p className="text-2xl font-bold">{totalQuizMarks}</p>
          </div>
        </GlassCard>
        
        <GlassCard className="p-6 flex items-center gap-4 border-accent/20 bg-accent/5">
          <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center text-accent">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Assignment Marks</p>
            <p className="text-2xl font-bold">{totalAssignmentMarks}</p>
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex items-center gap-4 border-success/20 bg-success/5">
          <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center text-success">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Grand Total</p>
            <p className="text-2xl font-bold">{grandTotal}</p>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Quizzes Section */}
        <GlassCard className="p-6 flex flex-col min-h-0">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" /> Quiz Attempts
          </h2>
          <div className="overflow-y-auto flex-1 pr-2 space-y-3">
            {quizAttempts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No quiz attempts yet.</p>
            ) : (
              quizAttempts.map((attempt) => {
                const isCheated = attempt.status === 'cheating_detected';
                return (
                  <div key={attempt.id} className={`p-4 rounded-xl border ${isCheated ? 'bg-error/10 border-error/50' : 'bg-background/50 border-glass-highlight'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-medium text-sm ${isCheated ? 'text-error' : ''}`}>{attempt.quizzes?.title || 'Unknown Quiz'}</h3>
                      {isCheated ? (
                        <span className="text-sm font-bold text-error">Cheating Detected</span>
                      ) : (
                        <span className="text-sm font-bold text-primary">{attempt.score} marks</span>
                      )}
                    </div>
                    <div className={`flex justify-between items-center text-xs ${isCheated ? 'text-error/70' : 'text-muted-foreground'}`}>
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
        <GlassCard className="p-6 flex flex-col min-h-0">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" /> Assignment Submissions
          </h2>
          <div className="overflow-y-auto flex-1 pr-2 space-y-3">
            {assignmentSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No graded assignments yet.</p>
            ) : (
              assignmentSubmissions.map((sub) => (
                <div key={sub.id} className="p-4 rounded-xl bg-background/50 border border-glass-highlight">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-sm">{sub.assignments?.title || 'Unknown Assignment'}</h3>
                    <span className="text-sm font-bold text-accent">{sub.marks} / {sub.assignments?.max_marks} marks</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span className="capitalize text-success">Graded</span>
                    <span>{new Date(sub.submitted_at).toLocaleDateString()}</span>
                  </div>
                  {sub.feedback && (
                    <p className="mt-2 text-xs text-muted-foreground bg-glass/30 p-2 rounded">
                      Feedback: {sub.feedback}
                    </p>
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
