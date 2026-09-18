import { supabase } from './supabase/client';
import type { AppNotification, NotificationPreferences } from '../types';

export const notificationService = {
  // Fetch unread notifications
  async getNotifications(userId: string, unreadOnly: boolean = false): Promise<AppNotification[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw new Error(error.message);
    return count || 0;
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw new Error(error.message);
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw new Error(error.message);
  },

  // Preferences
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    if (!data) {
      // Return defaults if none exist
      return {
        user_id: userId,
        assignment_notifications: true,
        quiz_notifications: true,
        grade_notifications: true,
        course_notifications: true,
        system_notifications: true,
        updated_at: new Date().toISOString()
      };
    }

    return data;
  },

  async updatePreferences(userId: string, prefs: Partial<NotificationPreferences>): Promise<void> {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: userId, ...prefs }, { onConflict: 'user_id' });

    if (error) throw new Error(error.message);
  },

  // Subscription (Supabase Realtime)
  subscribe(userId: string, callback: (payload: any) => void) {
    // Generate a unique channel name to prevent collisions during React StrictMode re-mounts
    const uniqueChannelName = `public:notifications:user_id=eq.${userId}-${Math.random().toString(36).substring(7)}`;
    return supabase
      .channel(uniqueChannelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe();
  }
};
