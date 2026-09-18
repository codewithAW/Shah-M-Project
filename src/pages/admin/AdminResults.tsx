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
    <div className="h-full flex flex-col p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Results</h1>
          <p className="text-muted-foreground mt-1">Overview of all student performances.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="w-72">
            <GlassInput 
              placeholder="Search by name or roll number..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <GlassButton variant="secondary" onClick={async () => {
            if (!filteredStudents.length) return Swal.fire('No results to export');
            const { exportToExcel } = await import('../../utils/exportUtils');
            exportToExcel(filteredStudents, [
              { header: 'Student', key: 'full_name' },
              { header: 'Roll Number', key: 'roll_number' },
              { header: 'Quiz Marks', key: 'quizMarks' },
              { header: 'Assignment Marks', key: 'assignmentMarks' },
              { header: 'Total Marks', key: 'totalMarks' }
            ], 'Student_Results');
          }}>Export Excel</GlassButton>
          <GlassButton variant="secondary" onClick={async () => {
            if (!filteredStudents.length) return Swal.fire('No results to export');
            const { exportToPDF } = await import('../../utils/exportUtils');
            exportToPDF(filteredStudents, [
              { header: 'Student', key: 'full_name' },
              { header: 'Roll Number', key: 'roll_number' },
              { header: 'Quiz Marks', key: 'quizMarks' },
              { header: 'Assignment Marks', key: 'assignmentMarks' },
              { header: 'Total Marks', key: 'totalMarks' }
            ], 'Student_Results', 'Overall Student Results');
          }}>Export PDF</GlassButton>
        </div>
      </div>

      <GlassCard className="flex-1 p-6 relative overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Award className="h-12 w-12 mb-4 opacity-20" />
            <p>No results found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-glass/50 border-b border-glass-highlight">
                <tr>
                  <th className="px-6 py-4 rounded-tl-xl font-medium">Student</th>
                  <th className="px-6 py-4 font-medium">Roll Number</th>
                  <th className="px-6 py-4 font-medium text-center">Quiz Marks</th>
                  <th className="px-6 py-4 font-medium text-center">Assignment Marks</th>
                  <th className="px-6 py-4 font-medium text-center">Total Marks</th>
                  <th className="px-6 py-4 rounded-tr-xl"></th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="border-b border-glass-highlight/50 hover:bg-glass/30 transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                        {student.full_name?.substring(0, 2).toUpperCase()}
                      </div>
                      {student.full_name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{student.roll_number}</td>
                    <td className="px-6 py-4 text-center">{student.quizMarks}</td>
                    <td className="px-6 py-4 text-center">{student.assignmentMarks}</td>
                    <td className="px-6 py-4 text-center font-bold text-primary">{student.totalMarks}</td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/teacher/results/${student.id}`} className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-glass text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronRight className="h-4 w-4" />
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
