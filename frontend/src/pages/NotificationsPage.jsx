import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useNotifications } from '../context/NotificationContext';
import StatusBadge from '../components/StatusBadge';

export default function NotificationsPage() {
  const { unreadCount, markRead, markAllRead } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications({ limit: 50, unreadOnly: filterUnread });
      if (res.success) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [filterUnread]);

  const handleMarkOne = async (id) => {
    await markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAll = async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto 80px', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>
            🔔 Notification Center
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px' }}>
            Real-time regulatory notices, custody transitions, and license approvals
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setFilterUnread(!filterUnread)}
            className={`btn btn-sm ${filterUnread ? 'btn-primary' : 'btn-outline'}`}
          >
            {filterUnread ? 'Showing Unread' : 'Filter Unread'}
          </button>

          {unreadCount > 0 && (
            <button onClick={handleMarkAll} className="btn btn-outline btn-sm">
              ✓ Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--accent-cyan)' }}>
            Loading notification feed...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            No notifications in your feed.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => !n.isRead && handleMarkOne(n._id)}
                style={{
                  padding: '16px',
                  background: n.isRead ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 242, 254, 0.08)',
                  border: `1px solid ${n.isRead ? 'var(--border-subtle)' : 'rgba(0, 242, 254, 0.4)'}`,
                  borderLeft: `4px solid ${n.isRead ? 'transparent' : 'var(--accent-cyan)'}`,
                  borderRadius: 'var(--radius-sm)',
                  cursor: n.isRead ? 'default' : 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <StatusBadge status={n.type} />
                    <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{n.title}</strong>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 8px' }}>
                    {n.message}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkOne(n._id);
                    }}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
