import { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { GlassButton } from './GlassButton';
import { GlassCard } from './GlassCard';
import { useAuth } from '../../hooks/useAuth';
import { notificationService } from '../../services/notificationService';
import type { AppNotification } from '../../types';
import { Link } from 'react-router-dom';

export function NotificationBell() {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (profile?.id) {
      loadNotifications();
      
      // Subscribe to real-time updates
      const subscription = notificationService.subscribe(profile.id, () => {
        loadNotifications();
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [profile]);

  const loadNotifications = async () => {
    if (!profile?.id) return;
    try {
      const data = await notificationService.getNotifications(profile.id, false);
      setNotifications(data.slice(0, 10)); // keep last 10 in dropdown
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profile?.id) return;
    try {
      await notificationService.markAllAsRead(profile.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  if (!profile) return null;

  return (
    <div className="relative">
      <GlassButton 
        variant="ghost" 
        size="sm" 
        className="relative h-9 w-9 rounded-full p-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-error text-[10px] font-bold flex items-center justify-center text-white ring-2 ring-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </GlassButton>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <GlassCard className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto z-50 p-0 shadow-2xl flex flex-col">
            <div className="p-4 border-b border-glass-highlight flex justify-between items-center sticky top-0 bg-background/95 backdrop-blur-md z-10">
              <h3 className="font-bold">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline font-medium">
                  Mark all read
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-glass-highlight/50">
                  {notifications.map(notif => (
                    <Link 
                      key={notif.id} 
                      to={notif.link || '#'} 
                      onClick={() => setIsOpen(false)}
                      className={`block p-4 hover:bg-glass/50 transition-colors ${!notif.is_read ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">{notif.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-2 opacity-70">
                            {new Date(notif.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {!notif.is_read && (
                          <button 
                            onClick={(e) => handleMarkAsRead(e, notif.id)}
                            className="shrink-0 h-6 w-6 rounded-full bg-glass flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                            title="Mark as read"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-2 border-t border-glass-highlight sticky bottom-0 bg-background/95 backdrop-blur-md">
              <Link to="/notifications" onClick={() => setIsOpen(false)}>
                <GlassButton variant="ghost" className="w-full text-xs h-8">
                  View All
                </GlassButton>
              </Link>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
