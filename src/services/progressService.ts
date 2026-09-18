import { supabase } from './supabase/client';
import type { LectureProgress, StudentActivity } from '../types';

export const progressService = {
  // Lecture Progress
  async getLectureProgress(studentId: string, lectureId: string): Promise<LectureProgress | null> {
    const { data, error } = await supabase
      .from('lecture_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('lecture_id', lectureId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching lecture progress:', error);
      return null;
    }
    return data;
  },

  async markLectureComplete(studentId: string, lectureId: string): Promise<LectureProgress> {
    // Upsert progress
    const { data, error } = await supabase
      .from('lecture_progress')
      .upsert({
        student_id: studentId,
        lecture_id: lectureId,
        completed: true,
        completed_at: new Date().toISOString(),
        progress_percentage: 100
      }, { onConflict: 'student_id,lecture_id' })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateLectureProgress(studentId: string, lectureId: string, percentage: number): Promise<LectureProgress> {
    const { data, error } = await supabase
      .from('lecture_progress')
      .upsert({
        student_id: studentId,
        lecture_id: lectureId,
        progress_percentage: percentage,
        last_viewed_at: new Date().toISOString()
      }, { onConflict: 'student_id,lecture_id' })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Course Progress Aggregation
  async getCourseProgress(studentId: string, courseId: string): Promise<{ completed: number, total: number, percentage: number }> {
    // 1. Get total published lectures for the course
    const { data: lectures, error: lecErr } = await supabase
      .from('lectures')
      .select('id')
      .eq('course_id', courseId)
      .eq('status', 'published');
      
    if (lecErr) throw new Error(lecErr.message);
    
    const total = lectures.length;
    if (total === 0) return { completed: 0, total: 0, percentage: 0 };

    // 2. Get completed lectures for this student
    const lectureIds = lectures.map((l: any) => l.id);
    const { data: progress, error: progErr } = await supabase
      .from('lecture_progress')
      .select('lecture_id')
      .eq('student_id', studentId)
      .eq('completed', true)
      .in('lecture_id', lectureIds);
      
    if (progErr) throw new Error(progErr.message);

    const completed = progress.length;
    const percentage = Math.round((completed / total) * 100);

    return { completed, total, percentage };
  },

  // Activity Tracking
  async logActivity(activity: Partial<StudentActivity>): Promise<void> {
    const session = await supabase.auth.getSession();
    if (!session.data.session) return;
    
    const { error } = await supabase
      .from('student_activity')
      .insert({
        student_id: session.data.session.user.id,
        ...activity
      });
      
    if (error) console.error("Failed to log activity:", error);
  },

  async getRecentActivity(studentId: string, limit: number = 10): Promise<StudentActivity[]> {
    const { data, error } = await supabase
      .from('student_activity')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data;
  }
};
