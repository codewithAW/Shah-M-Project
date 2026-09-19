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
    return (
      <div className="d-flex justify-center items-center p-20">
        <div className="animate-spin rounded-full" style={{ height: '2.5rem', width: '2.5rem', border: '4px solid var(--color-primary)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-col gap-8" style={{ maxWidth: '56rem', margin: '0 auto' }}>
      <div className="d-flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="dashboard-title text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted">Stay updated with your courses and assignments</p>
        </div>
        
        {notifications.some(n => !n.is_read) && (
          <GlassButton variant="ghost" onClick={handleMarkAllRead}>
            Mark all as read
          </GlassButton>
        )}
      </div>

      <GlassCard className="p-0 overflow-hidden shadow-sm" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
        {notifications.length === 0 ? (
          <div className="p-16 text-center text-muted">
            <div className="stat-icon text-primary mx-auto mb-6 shadow-sm" style={{ width: '6rem', height: '6rem', borderRadius: '1.5rem', background: 'linear-gradient(to bottom right, rgba(var(--color-primary-rgb), 0.2), rgba(var(--color-primary-rgb), 0.05))', border: '1px solid rgba(var(--color-primary-rgb), 0.1)' }}>
              <Bell style={{ height: '3rem', width: '3rem' }} />
            </div>
            <h3 className="text-xl font-bold mb-2 tracking-tight">You're all caught up!</h3>
            <p className="font-medium">You have no notifications right now.</p>
          </div>
        ) : (
          <div className="d-flex flex-col">
            {notifications.map((notif, index) => (
              <div 
                key={notif.id} 
                className="p-6 transition-all d-flex flex-wrap justify-between gap-5 hover-float"
                style={!notif.is_read ? { background: 'rgba(var(--color-primary-rgb), 0.05)', borderTop: index > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' } : { borderTop: index > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
              >
                <div style={{ flex: '1 1 0%' }}>
                  <div className="d-flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-bold tracking-tight">{notif.title}</h4>
                    {!notif.is_read && (
                      <span className="rounded-full bg-primary" style={{ height: '0.625rem', width: '0.625rem', boxShadow: '0 0 8px rgba(var(--color-primary-rgb), 0.6)', display: 'inline-block' }}></span>
                    )}
                  </div>
                  <p className="text-muted font-medium leading-relaxed">{notif.message}</p>
                  
                  <div className="d-flex items-center gap-4 mt-4">
                    <span className="text-xs text-muted font-bold tracking-widest uppercase rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.375rem 0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    {notif.link && (
                      <Link to={notif.link} className="text-sm font-bold text-primary" style={{ textDecoration: 'none' }}>
                        View Details
                      </Link>
                    )}
                  </div>
                </div>
                
                <div className="d-flex items-center justify-end gap-3" style={{ flexShrink: 0 }}>
                  {!notif.is_read && (
                    <GlassButton 
                      variant="ghost" 
                      size="sm" 
                      className="text-success p-0 rounded-full shadow-sm"
                      style={{ height: '2.5rem', width: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid transparent' }}
                      onClick={() => handleMarkAsRead(notif.id)}
                      title="Mark as read"
                    >
                      <Check style={{ height: '1.25rem', width: '1.25rem' }} />
                    </GlassButton>
                  )}
                  <GlassButton 
                    variant="ghost" 
                    size="sm" 
                    className="text-danger p-0 rounded-full shadow-sm"
                    style={{ height: '2.5rem', width: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid transparent' }}
                    onClick={() => handleDelete(notif.id)}
                    title="Delete"
                  >
                    <Trash2 style={{ height: '1.25rem', width: '1.25rem' }} />
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
