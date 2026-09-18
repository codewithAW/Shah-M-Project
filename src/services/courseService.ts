import { supabase } from './supabase/client';
import type { Course, CourseStatus } from '../types';

export const courseService = {
  // Get published courses for students
  async getPublishedCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select('*, profiles:teacher_id(id, full_name, avatar_url), course_categories(id, name)')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  },

  // Get a single published course by ID
  async getPublishedCourseById(id: string) {
    const { data, error } = await supabase
      .from('courses')
      .select('*, profiles:teacher_id(id, full_name, avatar_url), course_categories(id, name)')
      .eq('id', id)
      .eq('status', 'published')
      .single();
      
    if (error) throw error;
    return data;
  },

  // Get course by ID regardless of status
  async getCourseById(id: string) {
    const { data, error } = await supabase
      .from('courses')
      .select('*, profiles:teacher_id(id, full_name, avatar_url), course_categories(id, name)')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },

  // Get all courses for a specific teacher
  async getTeacherCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select('*, course_categories(id, name)')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  },

  // Create a new course
  async createCourse(courseData: Partial<Course>) {
    const { data, error } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  // Update a course
  async updateCourse(id: string, courseData: Partial<Course>) {
    const { data, error } = await supabase
      .from('courses')
      .update(courseData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  // Change course status (publish, unpublish, archive)
  async updateCourseStatus(id: string, status: CourseStatus) {
    const updateData: Partial<Course> = { status };
    if (status === 'published') {
      updateData.published_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  // Delete a course
  async deleteCourse(id: string) {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  },
  
  // Get all categories
  async getCategories() {
    const { data, error } = await supabase
      .from('course_categories')
      .select('*')
      .order('name', { ascending: true });
      
    if (error) throw error;
    return data;
  }
};
