import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi, useAuth } from '../App';

const NOTIF_ICONS = {
  'new_candidate': '🎉',
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
  const [loading, setLoading] = useState(true);
  const { request, addToast } = useApi();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const data = await request('/candidates/export/json');
      const notifRes = await fetch('/api/candidates?limit=1', { headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('hr_auth')).token}` } });
      const res = await fetch('/api/candidates?limit=1', { headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('hr_auth')).token}` } });
      // Load notifications via the dashboard endpoint workaround
      const dash = await request('/dashboard/stats');
      // Direct notification fetching isn't exposed as a separate route yet,
      // so we get candidates and generate notification-like data from dashboard
      setNotifications([]);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  // We need a direct notifications endpoint - let's check
  useEffect(() => {
    const token = JSON.parse(localStorage.getItem('hr_auth')).token;
    fetch('/api/candidates?limit=50&sort_by=created_at', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        // Transform candidates into notification-like data for display
        const notifs = (data.candidates || []).map(c => ({
          id: `c-${c.id}`,
          type: c.score >= 80 ? 'high_score' : 'new_candidate',
          title: c.score >= 80 ? 'Yuqori ball' : 'Yangi nomzod',
          message: c.score >= 80
            ? `${c.full_name} ${c.score} ball bilan yuqori baholandi`
            : `${c.full_name} tizimga qo'shildi`,
          is_read: 0,
          created_at: c.created_at,
          candidate_id: c.id,
          candidate_name: c.full_name
        }));
        setNotifications(notifs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    addToast('Barcha bildirishnomalar o\'qilgan deb belgilandi', 'success');
  };

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
  };

  if (loading) return <div className="loading"><div className="spinner" /> Yuklanmoqda...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bildirishnomalar</h1>
          <p>{notifications.filter(n => !n.is_read).length} ta o'qilmagan</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
          Barchasini o'qilgan deb belgilash
        </button>
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
                  {new Date(n.created_at).toLocaleDateString('uz-UZ')}
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
