import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { GlassCard } from '../../components/ui/GlassCard';
import { Award, Search, ChevronRight } from 'lucide-react';
import { GlassInput } from '../../components/ui/GlassInput';
import { Link } from 'react-router-dom';
import { GlassButton } from '../../components/ui/GlassButton';
import Swal from 'sweetalert2';


export function AdminResults() {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch active students
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .eq('status', 'active')
        .order('full_name');

      if (studentsError) throw studentsError;

      // 2. Fetch quiz attempts (best score per quiz or sum of best scores)
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quiz_attempts')
        .select('student_id, quiz_id, score')
        .not('score', 'is', null);

      if (quizzesError) throw quizzesError;

      // 3. Fetch assignment submissions (graded)
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignment_submissions')
        .select('student_id, marks')
        .not('marks', 'is', null);

      if (assignmentsError) throw assignmentsError;

      // 4. Aggregate data
      const resultsMap = new Map();

      (studentsData || []).forEach(student => {
        resultsMap.set(student.id, {
          ...student,
          quizMarks: 0,
          assignmentMarks: 0,
          totalMarks: 0,
          bestQuizScores: new Map() // track best score per quiz
        });
      });

      // Calculate quiz marks (taking max score per quiz per student)
      (quizzesData || []).forEach(attempt => {
        if (resultsMap.has(attempt.student_id)) {
          const student = resultsMap.get(attempt.student_id);
          const currentBest = student.bestQuizScores.get(attempt.quiz_id) || 0;
          if (attempt.score > currentBest) {
            student.bestQuizScores.set(attempt.quiz_id, attempt.score);
          }
        }
      });

      // Calculate assignment marks
      (assignmentsData || []).forEach(sub => {
        if (resultsMap.has(sub.student_id)) {
          const student = resultsMap.get(sub.student_id);
          student.assignmentMarks += (sub.marks || 0);
        }
      });

      // Finalize totals
      const finalResults = Array.from(resultsMap.values()).map(student => {
        let totalQuizMarks = 0;
        student.bestQuizScores.forEach((score: number) => { totalQuizMarks += score; });
        student.quizMarks = totalQuizMarks;
        student.totalMarks = totalQuizMarks + student.assignmentMarks;
        return student;
      });

      // Sort by total marks descending
      finalResults.sort((a, b) => b.totalMarks - a.totalMarks);

      setStudents(finalResults);
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ alignItems: 'center' }}>
        <div>
          <h1 className="dashboard-title">Student Results</h1>
          <p className="text-muted font-medium mt-1">Overview of all student performances.</p>
        </div>
        <div className="d-flex flex-wrap items-center gap-3" style={{ flex: '1 1 100%', width: '100%', minWidth: 0, justifyContent: 'space-between' }}>
          <div style={{ flex: '1 1 100%', maxWidth: '100%' }}>
            <GlassInput
              placeholder="Search student or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search style={{ height: '1.25rem', width: '1.25rem' }} />}
            />
          </div>
          <div className="d-flex items-center gap-2">
            <GlassButton variant="secondary" className="shadow-sm btn-export" style={{ flexShrink: 0 }} onClick={async () => {
              if (!filteredStudents.length) return Swal.fire('No results to export');
              const { exportToExcel } = await import('../../utils/exportUtils');
              exportToExcel(filteredStudents, [
                { header: 'Student', key: 'full_name' },
                { header: 'Roll Number', key: 'roll_number' },
                { header: 'Quiz Marks', key: 'quizMarks' },
                { header: 'Assignment Marks', key: 'assignmentMarks' },
                { header: 'Total Marks', key: 'totalMarks' }
              ], 'Student_Results');
            }}>
              <span className="export-icon" style={{ fontSize: '13px', fontWeight: 'bold' }}>Excel</span>
              <span className="export-text">Export Excel</span>
            </GlassButton>
            <GlassButton variant="secondary" className="shadow-sm btn-export" style={{ flexShrink: 0 }} onClick={async () => {
              if (!filteredStudents.length) return Swal.fire('No results to export');
              const { exportToPDF } = await import('../../utils/exportUtils');
              exportToPDF(filteredStudents, [
                { header: 'Student', key: 'full_name' },
                { header: 'Roll Number', key: 'roll_number' },
                { header: 'Quiz Marks', key: 'quizMarks' },
                { header: 'Assignment Marks', key: 'assignmentMarks' },
                { header: 'Total Marks', key: 'totalMarks' }
              ], 'Student_Results', 'Overall Student Results');
            }}>
              <span className="export-icon" style={{ fontSize: '13px', fontWeight: 'bold' }}>PDF</span>
              <span className="export-text">Export PDF</span>
            </GlassButton>
          </div>
        </div>
      </div>

      <GlassCard className="d-flex flex-col p-0 shadow-sm" style={{ flex: 1, overflow: 'hidden' }}>
        {isLoading ? (
          <div className="d-flex items-center justify-center h-full p-6">
            <div className="animate-spin h-8 w-8 rounded-full" style={{ border: '4px solid var(--color-primary)', borderTopColor: 'transparent' }}></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Award style={{ height: '3rem', width: '3rem', opacity: 0.5 }} />
            </div>
            <p className="empty-state-desc">No results found.</p>
          </div>
        ) : (
          <div className="table-container p-6">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll Number</th>
                  <th style={{ textAlign: 'center' }}>Quiz Marks</th>
                  <th style={{ textAlign: 'center' }}>Assignment Marks</th>
                  <th style={{ textAlign: 'center' }}>Total Marks</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="font-bold d-flex items-center gap-4">
                      <div className="d-flex items-center justify-center font-bold text-sm" style={{ height: '2.5rem', width: '2.5rem', borderRadius: '50%', background: 'rgba(var(--color-primary-rgb), 0.1)', color: 'var(--color-primary)', border: '1px solid rgba(var(--color-primary-rgb), 0.2)' }}>
                        {student.full_name?.substring(0, 2).toUpperCase()}
                      </div>
                      {student.full_name}
                    </td>
                    <td className="text-muted">{student.roll_number}</td>
                    <td className="font-bold" style={{ textAlign: 'center' }}>{student.quizMarks}</td>
                    <td className="font-bold" style={{ textAlign: 'center' }}>{student.assignmentMarks}</td>
                    <td className="font-bold text-primary" style={{ textAlign: 'center' }}>{student.totalMarks}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/teacher/results/${student.id}`} className="btn-icon shadow-sm" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-muted)' }}>
                        <ChevronRight style={{ height: '1.25rem', width: '1.25rem' }} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
