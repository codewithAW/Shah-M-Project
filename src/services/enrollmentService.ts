import { supabase } from './supabase/client';
// no-unused-imports

export const enrollmentService = {
  // Get all active enrollments for the logged in student
  async getMyEnrollments() {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, courses(*, profiles:teacher_id(id, full_name, avatar_url))')
      .eq('status', 'active')
      .order('enrolled_at', { ascending: false });
      
    if (error) throw error;
    return data;
  },

  // Check if student is enrolled in a specific course (returns the enrollment)
  async checkEnrollment(courseId: string, studentId: string) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('course_id', courseId)
      .eq('student_id', studentId)
      .maybeSingle();
      
    if (error) throw error;
    return data;
  },

  // Request to enroll in a course
  async enroll(courseId: string, studentId: string) {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        course_id: courseId,
        student_id: studentId,
        status: 'pending' // Requires teacher approval
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  // Get pending enrollments for a teacher's courses
  async getPendingEnrollments() {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, courses!inner(title, teacher_id), profiles:student_id(id, full_name, roll_number)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  },

  // Approve an enrollment request
  async approveEnrollment(enrollmentId: string) {
    const { error } = await supabase
      .from('enrollments')
      .update({ status: 'active', enrolled_at: new Date().toISOString() })
      .eq('id', enrollmentId);
      
    if (error) throw error;
  },

  // Reject an enrollment request (delete it)
  async rejectEnrollment(enrollmentId: string) {
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('id', enrollmentId);
      
    if (error) throw error;
  }
};
