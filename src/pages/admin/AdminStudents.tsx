import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassInput } from '../../components/ui/GlassInput';
import { Users, Search, BookOpen, Filter, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { GlassButton } from '../../components/ui/GlassButton';
import Swal from 'sweetalert2';

interface StudentWithCourses {
  id: string;
  full_name: string;
  roll_number: string;
  username: string;
  email: string;
  status: string;
  created_at: string;
  courses: string[];
}

export function AdminStudents() {
  const { user, profile } = useAuth();
  const [students, setStudents] = useState<StudentWithCourses[]>([]);
  const [teacherCoursesList, setTeacherCoursesList] = useState<{id: string, title: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch courses and determine teacher's courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, teacher_id');

      if (coursesError) throw coursesError;

      const teacherCourses = profile?.role === 'admin' 
        ? coursesData || [] 
        : (coursesData || []).filter(c => c.teacher_id === user?.id);
        
      setTeacherCoursesList(teacherCourses);
      const courseIds = teacherCourses.map(c => c.id);

      if (courseIds.length === 0) {
        setStudents([]);
        return;
      }

      // 2. Fetch enrollments for these courses
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('student_id, course_id')
        .in('course_id', courseIds);

      if (enrollmentsError) throw enrollmentsError;
      
      // 2a. Fetch quizzes for these courses
      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select('id, course_id')
        .in('course_id', courseIds);
        
      const quizIds = (quizzesData || []).map(q => q.id);
      
      // 2b. Fetch quiz attempts
      let quizAttemptsData: any[] = [];
      if (quizIds.length > 0) {
        const { data } = await supabase
          .from('quiz_attempts')
          .select('student_id, quiz_id')
          .in('quiz_id', quizIds);
        quizAttemptsData = data || [];
      }
      
      // 2c. Fetch assignments for these courses
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('id, course_id')
        .in('course_id', courseIds);
        
      const assignmentIds = (assignmentsData || []).map(a => a.id);
      
      // 2d. Fetch assignment submissions
      let assignmentSubmissionsData: any[] = [];
      if (assignmentIds.length > 0) {
        const { data } = await supabase
          .from('assignment_submissions')
          .select('student_id, assignment_id')
          .in('assignment_id', assignmentIds);
        assignmentSubmissionsData = data || [];
      }

      // Collect all valid student IDs
      const studentIdsSet = new Set<string>();
      (enrollmentsData || []).forEach(e => studentIdsSet.add(e.student_id));
      quizAttemptsData.forEach(q => studentIdsSet.add(q.student_id));
      assignmentSubmissionsData.forEach(a => studentIdsSet.add(a.student_id));

      const studentIds = Array.from(studentIdsSet);

      if (studentIds.length === 0) {
        setStudents([]);
        return;
      }

      // 3. Fetch profiles of these students
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, roll_number, username, email, status, created_at')
        .eq('role', 'student')
        .eq('status', 'active')
        .in('id', studentIds)
        .order('full_name', { ascending: true });

      if (profilesError) throw profilesError;

      // Map enrollments to students
      const studentMap: Record<string, string[]> = {};
      
      const addStudentCourse = (sid: string, courseId: string) => {
        const course = teacherCourses.find(c => c.id === courseId);
        const courseTitle = course?.title;
        if (courseTitle) {
          if (!studentMap[sid]) studentMap[sid] = [];
          if (!studentMap[sid].includes(courseTitle)) {
            studentMap[sid].push(courseTitle);
          }
        }
      };

      (enrollmentsData || []).forEach((enrollment: any) => {
        addStudentCourse(enrollment.student_id, enrollment.course_id);
      });
      
      quizAttemptsData.forEach((attempt: any) => {
        const quiz = quizzesData?.find(q => q.id === attempt.quiz_id);
        if (quiz) addStudentCourse(attempt.student_id, quiz.course_id);
      });
      
      assignmentSubmissionsData.forEach((sub: any) => {
        const assignment = assignmentsData?.find(a => a.id === sub.assignment_id);
        if (assignment) addStudentCourse(sub.student_id, assignment.course_id);
      });

      const studentsWithCourses: StudentWithCourses[] = (profilesData || []).map((p: any) => ({
        ...p,
        courses: studentMap[p.id] || [],
      }));

      setStudents(studentsWithCourses);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      s.full_name?.toLowerCase().includes(q) ||
      s.roll_number?.toLowerCase().includes(q) ||
      s.username?.toLowerCase().includes(q) ||
      s.courses.some((c) => c.toLowerCase().includes(q));

    const matchesCourse = selectedCourse === 'all' || s.courses.includes(selectedCourse);

    return matchesSearch && matchesCourse;
  });

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Students</h1>
          <p className="text-muted font-medium mt-1">
            View all enrolled students, their roll numbers, and courses.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(99,102,241,0.08)', padding: '0.75rem 1.25rem', borderRadius: '1rem' }}>
          <Users style={{ height: '1.25rem', width: '1.25rem', color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>{students.length}</span>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>Total Students</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="d-flex flex-col gap-4">
        <div className="d-flex flex-wrap items-center gap-3" style={{ flex: '1 1 100%', width: '100%', minWidth: 0, justifyContent: 'space-between' }}>
          <div style={{ flex: '1 1 100%', maxWidth: '100%' }}>
            <GlassInput
              placeholder="Search by name, roll number, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search style={{ height: '1.25rem', width: '1.25rem' }} />}
            />
          </div>
          <div className="d-flex items-center gap-2">
            <GlassButton variant="secondary" className="shadow-sm btn-export" style={{ flexShrink: 0 }} onClick={async () => {
              if (!filtered.length) return Swal.fire('No students to export');
              const { exportToExcel } = await import('../../utils/exportUtils');
              const dataToExport = filtered.map(s => ({
                ...s,
                courses_list: s.courses.length > 0 ? s.courses.join(', ') : 'None'
              }));
              exportToExcel(dataToExport, [
                { header: 'Name', key: 'full_name' },
                { header: 'Roll Number', key: 'roll_number' },
                { header: 'Username', key: 'username' },
                { header: 'Email', key: 'email' },
                { header: 'Courses', key: 'courses_list' }
              ], 'Students_List');
            }}>
              <span className="export-icon" style={{ fontSize: '13px', fontWeight: 'bold' }}>Excel</span>
              <span className="export-text">Export Excel</span>
            </GlassButton>
            <GlassButton variant="secondary" className="shadow-sm btn-export" style={{ flexShrink: 0 }} onClick={async () => {
              if (!filtered.length) return Swal.fire('No students to export');
              const { exportToPDF } = await import('../../utils/exportUtils');
              const dataToExport = filtered.map(s => ({
                ...s,
                courses_list: s.courses.length > 0 ? s.courses.join(', ') : 'None'
              }));
              exportToPDF(dataToExport, [
                { header: 'Name', key: 'full_name' },
                { header: 'Roll Number', key: 'roll_number' },
                { header: 'Username', key: 'username' },
                { header: 'Email', key: 'email' },
                { header: 'Courses', key: 'courses_list' }
              ], 'Students_List', 'Enrolled Students List');
            }}>
              <span className="export-icon" style={{ fontSize: '13px', fontWeight: 'bold' }}>PDF</span>
              <span className="export-text">Export PDF</span>
            </GlassButton>
          </div>
        </div>

        <div style={{ position: 'relative', minWidth: '14rem', maxWidth: '300px' }}>
          <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-muted-foreground)' }}>
            <Filter style={{ height: '1rem', width: '1rem' }} />
          </div>
          <div 
            className="form-input d-flex items-center justify-between"
            style={{ 
              padding: '0.625rem 1rem 0.625rem 2.25rem',
              cursor: 'pointer', 
              userSelect: 'none',
              borderRadius: '0.75rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              width: '100%',
              fontSize: '0.875rem'
            }}
            onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
          >
            <span className="truncate">
              {selectedCourse === 'all' 
                ? `All Categories (${students.length})` 
                : `${selectedCourse} (${students.filter(s => s.courses.includes(selectedCourse)).length})`
              }
            </span>
            <ChevronDown style={{ height: '1rem', width: '1rem', opacity: 0.5, transform: isCourseDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>

          {isCourseDropdownOpen && (
            <>
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
                onClick={() => setIsCourseDropdownOpen(false)} 
              />
              <div 
                style={{ 
                  position: 'absolute', 
                  top: 'calc(100% + 0.5rem)', 
                  left: 0, 
                  right: 0, 
                  background: 'var(--color-background)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.75rem',
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                  zIndex: 50,
                  overflow: 'hidden',
                  backdropFilter: 'blur(20px)'
                }}
              >
                <div 
                  style={{ padding: '0.75rem 1rem', cursor: 'pointer', transition: 'background 0.2s', fontSize: '0.875rem', background: selectedCourse === 'all' ? 'rgba(var(--color-primary-rgb), 0.1)' : 'transparent' }}
                  onClick={() => { setSelectedCourse('all'); setIsCourseDropdownOpen(false); }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = selectedCourse === 'all' ? 'rgba(var(--color-primary-rgb), 0.1)' : 'transparent'}
                >
                  All Categories ({students.length})
                </div>
                {teacherCoursesList.map(course => {
                  const count = students.filter(s => s.courses.includes(course.title)).length;
                  const isSelected = selectedCourse === course.title;
                  return (
                    <div 
                      key={course.id}
                      style={{ padding: '0.75rem 1rem', cursor: 'pointer', transition: 'background 0.2s', fontSize: '0.875rem', background: isSelected ? 'rgba(var(--color-primary-rgb), 0.1)' : 'transparent' }}
                      onClick={() => { setSelectedCourse(course.title); setIsCourseDropdownOpen(false); }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'rgba(var(--color-primary-rgb), 0.1)' : 'transparent'}
                    >
                      {course.title} ({count})
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <GlassCard className="d-flex flex-col shadow-sm" style={{ overflow: 'auto', padding: 0 }}>
        {isLoading ? (
          <div className="d-flex items-center justify-center p-12">
            <div className="animate-spin h-8 w-8 rounded-full" style={{ border: '4px solid var(--color-primary)', borderTopColor: 'transparent' }}></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ border: 'none', background: 'transparent' }}>
            <div className="empty-state-icon">
              <Users style={{ height: '3rem', width: '3rem', opacity: 0.5 }} />
            </div>
            <p className="empty-state-desc">
              {searchQuery ? 'No students match your search.' : 'No enrolled students found.'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.1)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>#</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Name</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Roll Number</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Username</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Enrolled Courses</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, idx) => (
                  <tr
                    key={student.id}
                    style={{
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)')}
                  >
                    <td style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: 'var(--color-muted-foreground)' }}>{idx + 1}</td>
                    <td style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>{student.full_name || '—'}</td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <span style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary)', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.8rem' }}>
                        {student.roll_number || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--color-muted-foreground)' }}>{student.username || '—'}</td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      {student.courses.length === 0 ? (
                      <span style={{ color: 'var(--color-muted-foreground)', fontStyle: 'italic' }}>No courses</span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {student.courses.map((course, cIdx) => (
                          <span
                            key={cIdx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              background: 'rgba(16,185,129,0.1)',
                              color: '#065f46',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '0.5rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            <BookOpen style={{ height: '0.7rem', width: '0.7rem' }} />
                            {course}
                          </span>
                        ))}
                      </div>
                    )}
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
