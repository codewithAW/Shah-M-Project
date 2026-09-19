import { supabase } from '../supabase/client';
import { API_BASE } from '../../config';

export const driveService = {
  async uploadFile(file: File) {
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
      const err = await response.json().catch(() => null);
      throw new Error(err?.error || "Failed to upload file to Google Drive");
    }

    return response.json();
  }
};
