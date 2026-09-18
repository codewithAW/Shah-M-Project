import { supabase } from './supabase/client';
import type { Assignment, AssignmentSubmission } from '../types';
import { progressService } from './progressService';

export const assignmentService = {
  // Assignments
  async getMyAssignments() {
    const { data, error } = await supabase
      .from('assignments')
      .select('*, courses(title)')
      .order('due_date', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getAssignmentsByCourse(courseId: string) {
    const { data, error } = await supabase
      .from('assignments')
      .select('*, courses(title)')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getAssignment(id: string) {
    const { data, error } = await supabase
      .from('assignments')
      .select('*, courses(title, teacher_id)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async createAssignment(assignmentData: Partial<Assignment>) {
    const { data, error } = await supabase
      .from('assignments')
      .insert(assignmentData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateAssignment(id: string, assignmentData: Partial<Assignment>) {
    const user = (await supabase.auth.getUser()).data.user;
    
    // Check if we are publishing
    const isPublishing = assignmentData.status === 'published';
    let oldAssignment: any = null;
    if (isPublishing) {
      const { data } = await supabase.from('assignments').select('status, title, course_id').eq('id', id).single();
      oldAssignment = data;
    }

    const { data, error } = await supabase
      .from('assignments')
      .update(assignmentData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    // Create notifications for enrolled students if it was just published
    if (isPublishing && oldAssignment?.status !== 'published' && user) {
      // Get enrolled students
      const { data: enrollments } = await supabase.from('enrollments').select('student_id').eq('course_id', data.course_id).eq('status', 'active');
      
      if (enrollments && enrollments.length > 0) {
        const notifications = enrollments.map(e => ({
          user_id: e.student_id,
          type: 'ASSIGNMENT_PUBLISHED',
          title: 'New Assignment',
          message: `A new assignment "${data.title}" has been published.`,
          link: `/assignments/${data.id}`,
          course_id: data.course_id,
          created_by: user.id
        }));
        
        supabase.from('notifications').insert(notifications).then(res => {
          if (res.error) console.error("Batch Notify Error:", res.error);
        });
      }
    }
    
    return data;
  },

  async deleteAssignment(id: string) {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Submissions
  async getStudentSubmission(assignmentId: string, studentId: string) {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .maybeSingle(); // might not exist yet
    if (error) throw error;
    return data;
  },

  async getSubmissionsByAssignment(assignmentId: string) {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select('*, profiles:profiles!assignment_submissions_student_id_fkey(full_name, avatar_url, roll_number)')
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createOrUpdateSubmission(submissionData: Partial<AssignmentSubmission>) {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .upsert(submissionData, { onConflict: 'assignment_id, student_id' })
      .select()
      .single();
    if (error) throw error;
    
    // Log Activity
    if (submissionData.status === 'submitted') {
      progressService.logActivity({
        activity_type: 'assignment_submitted',
        assignment_id: data.assignment_id
      }).catch(console.error);
    }
    
    return data;
  },

  async gradeSubmission(id: string, marks: number, feedback: string) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({
        marks,
        feedback,
        status: 'graded',
        graded_at: new Date().toISOString(),
        graded_by: user.id
      })
      .eq('id', id)
      .select('*, assignments(title, course_id)')
      .single();
    if (error) throw error;

    // Create Notification for Student
    if (data && data.student_id) {
      supabase.from('notifications').insert({
        user_id: data.student_id,
        type: 'ASSIGNMENT_GRADED',
        title: 'Assignment Graded',
        message: `Your assignment "${data.assignments.title}" has been graded by your teacher.`,
        link: `/assignments/${data.assignment_id}`,
        course_id: data.assignments.course_id,
        created_by: user.id
      }).then(res => {
        if(res.error) console.error("Notification Error:", res.error);
      });
    }

    return data;
  }
};
