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
    <div className="relative" style={{ position: 'relative' }}>
      <GlassButton 
        variant="ghost" 
        size="sm" 
        className="relative h-9 w-9 rounded-full p-0"
        style={{ position: 'relative' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="notification-bell-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </GlassButton>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />
          <GlassCard className="notification-dropdown">
            <div className="notification-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="notification-mark-read">
                  Mark all read
                </button>
              )}
            </div>
            
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="notification-empty">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div>
                  {notifications.map(notif => (
                    <Link 
                      key={notif.id} 
                      to={notif.link || '#'} 
                      onClick={() => setIsOpen(false)}
                      className={`notification-item ${!notif.is_read ? 'is-unread' : ''}`}
                    >
                      <div className="notification-item-layout">
                        <div>
                          <h4 className="notification-item-title">{notif.title}</h4>
                          <p className="notification-item-message">{notif.message}</p>
                          <p className="notification-item-date">
                            {new Date(notif.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {!notif.is_read && (
                          <button 
                            onClick={(e) => handleMarkAsRead(e, notif.id)}
                            className="notification-item-check"
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
            
            <div className="notification-footer">
              <Link to="/notifications" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none' }}>
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
