import { supabase } from './supabase/client';
import type { Lecture, CourseStatus } from '../types';

export const lectureService = {
  // Get all lectures for a course
  async getLecturesByCourse(courseId: string) {
    const { data, error } = await supabase
      .from('lectures')
      .select('*')
      .eq('course_id', courseId)
      .order('lecture_order', { ascending: true });
      
    if (error) throw error;
    return data;
  },
  
  // Get only published lectures for a course (student view)
  async getPublishedLectures(courseId: string) {
    const { data, error } = await supabase
      .from('lectures')
      .select('*')
      .eq('course_id', courseId)
      .eq('status', 'published')
      .order('lecture_order', { ascending: true });
      
    if (error) throw error;
    return data;
  },

  // Get a single lecture
  async getLectureById(id: string) {
    const { data, error } = await supabase
      .from('lectures')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },

  // Create a lecture
  async createLecture(lectureData: Partial<Lecture>) {
    const { data, error } = await supabase
      .from('lectures')
      .insert(lectureData)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  // Update a lecture
  async updateLecture(id: string, lectureData: Partial<Lecture>) {
    const { data, error } = await supabase
      .from('lectures')
      .update(lectureData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  // Change lecture status
  async updateLectureStatus(id: string, status: CourseStatus) {
    const updateData: Partial<Lecture> = { status };
    if (status === 'published') {
      updateData.published_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('lectures')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  // Delete a lecture
  async deleteLecture(id: string) {
    const { error } = await supabase
      .from('lectures')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  },

  // Reorder lectures (swap positions basically, or update order index)
  async updateLectureOrders(orders: { id: string, lecture_order: number }[]) {
    // Supabase JS doesn't have bulk upsert array perfectly cleanly for updates that don't overwrite other fields,
    // so we can loop or use a backend function. For Phase 3 frontend we'll loop sequentially since it's a few rows.
    for (const item of orders) {
      const { error } = await supabase
        .from('lectures')
        .update({ lecture_order: item.lecture_order })
        .eq('id', item.id);
        
      if (error) {
        console.error('Error updating lecture order:', error);
        throw error;
      }
    }
  }
};
