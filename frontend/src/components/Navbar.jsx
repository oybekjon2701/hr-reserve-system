import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, useApi } from '../App';

export default function Navbar() {
  const { logout, addToast, role, darkMode, toggleDarkMode, unreadNotifs, setUnreadNotifs } = useAuth();
  const { request } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const data = await request('/notifications/unread-count');
        setUnreadNotifs(data.count || 0);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    addToast('Tizimdan chiqildi', 'info');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>HR Rezerv</h2>
        <small>Boshqaruv tizimi</small>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/" end className="sidebar-link">
          <span className="sidebar-icon">🏠</span>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/candidates" className="sidebar-link">
          <span className="sidebar-icon">👥</span>
          <span>Nomzodlar</span>
        </NavLink>
        <NavLink to="/notifications" className="sidebar-link">
          <span className="sidebar-icon">🔔</span>
          <span>Bildirishnomalar</span>
          {unreadNotifs > 0 && <span className="badge">{unreadNotifs > 99 ? '99+' : unreadNotifs}</span>}
        </NavLink>
        <NavLink to="/reports" className="sidebar-link">
          <span className="sidebar-icon">📊</span>
          <span>Hisobotlar</span>
        </NavLink>
        <NavLink to="/mock-form" className="sidebar-link">
          <span className="sidebar-icon">📝</span>
          <span>Forma sinov</span>
        </NavLink>
        {role === 'administrator' && (
          <NavLink to="/users" className="sidebar-link">
            <span className="sidebar-icon">⚙️</span>
            <span>Foydalanuvchilar</span>
          </NavLink>
        )}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <div style={{ fontWeight: 600, color: 'var(--gray-700)', fontSize: 13 }}>
            {role === 'administrator' ? '👤 Administrator' : '👤 HR Menejer'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          <button onClick={toggleDarkMode} className="btn btn-ghost btn-sm" style={{ flex: 1 }} title={darkMode ? 'Yorug\' rejim' : 'Qorong\'u rejim'}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ flex: 2 }}>
            Chiqish
          </button>
        </div>
      </div>
    </aside>
  );
}
