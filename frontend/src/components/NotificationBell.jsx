import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCircle2, Loader2 } from 'lucide-react';
import { fetchApi } from '../api';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await fetchApi('/notifications');
      // Sort by newest first
      const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(sorted);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds as a fallback, STOMP pushes immediately anyway
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    try {
      setLoading(true);
      await fetchApi(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;
      await Promise.all(unreadIds.map(id => fetchApi(`/notifications/${id}/read`, { method: 'PUT' })));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => { setOpen(!open); if(!open) fetchNotifications(); }}
        style={{ 
          background: 'transparent', 
          border: 'none', 
          color: 'var(--text-main)', 
          cursor: 'pointer', 
          position: 'relative',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          transition: 'background 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 4,
            right: 4,
            background: '#ef4444',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            padding: '2px 6px',
            borderRadius: '10px',
            lineHeight: 1
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          width: 340,
          background: 'rgba(15, 23, 42, 0.98)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
          zIndex: 100,
          overflow: 'hidden',
          marginTop: '8px'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                disabled={loading}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '13px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                {loading ? <Loader2 size={14} className="lucide-spin" /> : <CheckCircle2 size={14} />}
                Mark all read
              </button>
            )}
          </div>
          <div style={{ maxHeight: 350, overflowY: 'auto', padding: '8px' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: n.read ? 'transparent' : 'rgba(16, 185, 129, 0.1)',
                  borderLeft: n.read ? '3px solid transparent' : '3px solid #10B981',
                  marginBottom: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'background 0.2s'
                }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: 1.4 }}>
                    {n.message}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                    {!n.read && (
                      <button 
                        onClick={() => markAsRead(n.id)}
                        disabled={loading}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#10B981',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {loading ? <Loader2 size={12} className="lucide-spin" /> : <Check size={12} />}
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
