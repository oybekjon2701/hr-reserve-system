import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, useApi } from '../App';

export default function Navbar() {
  const { logout, addToast, role } = useAuth();
  const navigate = useNavigate();

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
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/candidates" className="sidebar-link">
          <span>Nomzodlar</span>
        </NavLink>
        <NavLink to="/notifications" className="sidebar-link">
          <span>Bildirishnomalar</span>
        </NavLink>
        <NavLink to="/mock-form" className="sidebar-link">
          <span>Forma sinov</span>
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <div style={{ fontWeight: 600, color: 'var(--gray-700)' }}>
            {role === 'administrator' ? 'Administrator' : 'HR Menejer'}
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ marginTop: 8, width: '100%' }}>
          Chiqish
        </button>
      </div>
    </aside>
  );
}
