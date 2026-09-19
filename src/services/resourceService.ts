import { supabase } from './supabase/client';
import type { Resource } from '../types';
import { API_BASE } from '../config';

export const resourceService = {
  // Get all resources for a course
  async getResourcesByCourse(courseId: string) {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  },

  // Get resources for a specific lecture
  async getResourcesByLecture(lectureId: string) {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('lecture_id', lectureId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  },

  // Create a resource (metadata only for Phase 3)
  async createResource(resourceData: Partial<Resource>) {
    const { data, error } = await supabase
      .from('resources')
      .insert(resourceData)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  // Update a resource
  async updateResource(id: string, resourceData: Partial<Resource>) {
    const { data, error } = await supabase
      .from('resources')
      .update(resourceData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  // Delete a resource
  async deleteResource(id: string) {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  },

  // Phase 4: Upload file to Google Drive via backend API
  async uploadResourceFile(file: File) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) throw new Error("Not authenticated");

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/api/drive/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.error || 'Upload failed');
    }

    return response.json();
  },

  async uploadResourceFileStudent(file: File) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) throw new Error("Not authenticated");

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/api/drive/upload/student`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.error || 'Upload failed');
    }

    return response.json();
  },

  // Phase 4: Delete file from Google Drive via backend API
  async deleteDriveFile(driveFileId: string) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(`${API_BASE}/api/drive/delete/${driveFileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.error || 'Failed to delete file from Drive');
    }

    return response.json();
  },
  
  // High-level delete that removes both Drive file and DB record
  async deleteResourceWithFile(resource: Resource) {
    if (resource.storage_provider === 'google_drive' && resource.drive_file_id) {
      try {
        await this.deleteDriveFile(resource.drive_file_id);
      } catch (err) {
        console.error("Failed to delete drive file, proceeding to delete DB record anyway", err);
      }
    }
    
    await this.deleteResource(resource.id);
  }
};
