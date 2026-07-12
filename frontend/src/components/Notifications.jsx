import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../App';

const NOTIF_ICONS = {
  'new_candidate': '📥',
  'duplicate': '⚠️',
  'high_score': '⭐',
  'stale': '⏰',
  'reminder': '📌'
};

const NOTIF_COLORS = {
  'new_candidate': '#2563eb',
  'duplicate': '#f59e0b',
  'high_score': '#16a34a',
  'stale': '#dc2626',
  'reminder': '#8b5cf6'
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { request, addToast } = useApi();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const data = await request('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    try {
      await request('/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      addToast("Barcha bildirishnomalar o'qilgan deb belgilandi", 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const markRead = async (id) => {
    try {
      await request(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /> Yuklanmoqda...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bildirishnomalar</h1>
          <p>{unreadCount} ta o'qilmagan</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
            Barchasini o'qilgan deb belgilash
          </button>
        )}
      </div>

      <div className="table-container">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h3>Bildirishnoma yo'q</h3>
            <p>Yangi bildirishnomalar bu yerda ko'rinadi.</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`notification-item ${!n.is_read ? 'unread' : ''}`}
              onClick={() => { markRead(n.id); if (n.candidate_id) navigate(`/candidates/${n.candidate_id}`); }}
            >
              <div className="notif-icon" style={{ background: `${NOTIF_COLORS[n.type] || '#6b7280'}20`, color: NOTIF_COLORS[n.type] || '#6b7280' }}>
                {NOTIF_ICONS[n.type] || '📋'}
              </div>
              <div className="notif-content">
                <div className="notif-title">{n.title}</div>
                <div className="notif-message">{n.message}</div>
                <div className="notif-time">
                  {new Date(n.created_at).toLocaleString('uz-UZ')}
                  {n.candidate_name && <span> · {n.candidate_name}</span>}
                </div>
              </div>
              {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
