import { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { useAuth } from '../../hooks/useAuth';
import { notificationService } from '../../services/notificationService';
import type { AppNotification } from '../../types';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase/client';

export function Notifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadNotifications();
    }
  }, [profile]);

  const loadNotifications = async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    try {
      const data = await notificationService.getNotifications(profile.id, false);
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!profile?.id) return;
    try {
      await notificationService.markAllAsRead(profile.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
      await supabase.from('notifications').delete().eq('id', id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-20"><div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">Stay updated with your courses and assignments</p>
        </div>
        
        {notifications.some(n => !n.is_read) && (
          <GlassButton variant="ghost" onClick={handleMarkAllRead}>
            Mark all as read
          </GlassButton>
        )}
      </div>

      <GlassCard className="p-0 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground">
            <div className="h-20 w-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold mb-2">You're all caught up!</h3>
            <p>You have no notifications right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-glass-highlight">
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`p-6 transition-colors hover:bg-glass/30 flex flex-col sm:flex-row justify-between gap-4 ${!notif.is_read ? 'bg-primary/5' : ''}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-semibold text-foreground">{notif.title}</h4>
                    {!notif.is_read && (
                      <span className="h-2 w-2 rounded-full bg-primary inline-block"></span>
                    )}
                  </div>
                  <p className="text-muted-foreground">{notif.message}</p>
                  
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-muted-foreground font-medium bg-background/50 px-2 py-1 rounded-md">
                      {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    {notif.link && (
                      <Link to={notif.link} className="text-sm font-medium text-primary hover:underline">
                        View Details
                      </Link>
                    )}
                  </div>
                </div>
                
                <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0">
                  {!notif.is_read && (
                    <GlassButton 
                      variant="ghost" 
                      size="sm" 
                      className="text-success h-9 w-9 p-0 rounded-full"
                      onClick={() => handleMarkAsRead(notif.id)}
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </GlassButton>
                  )}
                  <GlassButton 
                    variant="ghost" 
                    size="sm" 
                    className="text-error h-9 w-9 p-0 rounded-full hover:bg-error/10"
                    onClick={() => handleDelete(notif.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </GlassButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
