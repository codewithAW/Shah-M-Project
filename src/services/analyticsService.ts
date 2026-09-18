import { supabase } from './supabase/client';

// Helper for Teacher Analytics
export const analyticsService = {
  // Course Overview Analytics
  async getCourseAnalytics(courseId: string) {
    // Total Enrollments
    const { count: totalEnrolled } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .eq('status', 'active');

    // Total Assignments & Submissions
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id')
      .eq('course_id', courseId)
      .in('status', ['published', 'closed']);

    let totalSubmissions = 0;
    if (assignments && assignments.length > 0) {
      const { count } = await supabase
        .from('assignment_submissions')
        .select('*', { count: 'exact', head: true })
        .in('assignment_id', assignments.map((a: any) => a.id));
      totalSubmissions = count || 0;
    }

    // Average Quiz Score
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id')
      .eq('course_id', courseId)
      .in('status', ['published', 'closed']);

    let avgQuizScore = 0;
    if (quizzes && quizzes.length > 0) {
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('percentage')
        .in('quiz_id', quizzes.map((q: any) => q.id))
        .not('percentage', 'is', null);

      if (attempts && attempts.length > 0) {
        const sum = attempts.reduce((acc: number, curr: any) => acc + (curr.percentage || 0), 0);
        avgQuizScore = Math.round(sum / attempts.length);
      }
    }

    return {
      totalEnrolled: totalEnrolled || 0,
      totalAssignments: assignments?.length || 0,
      totalSubmissions,
      avgQuizScore
    };
  },

  // Teacher Dashboard Overview
  async getTeacherOverview(teacherId: string) {
    const { data: courses } = await supabase
      .from('courses')
      .select('id')
      .eq('teacher_id', teacherId);

    const courseIds = courses?.map((c: any) => c.id) || [];

    let totalStudents = 0;
    if (courseIds.length > 0) {
      // Using unique student_ids enrolled across teacher's courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_id')
        .in('course_id', courseIds)
        .eq('status', 'active');
      
      const uniqueStudents = new Set(enrollments?.map((e: any) => e.student_id));
      totalStudents = uniqueStudents.size;
    }

    return {
      totalCourses: courseIds.length,
      totalStudents
    };
  }
};
