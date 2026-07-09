import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CandidateList from './components/CandidateList';
import CandidateProfile from './components/CandidateProfile';
import Notifications from './components/Notifications';
import MockForm from './components/MockForm';
import Navbar from './components/Navbar';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export const useApi = () => {
  const { token } = useAuth();
  const base = '/api';
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const request = async (path, options = {}) => {
    const res = await fetch(`${base}${path}`, { headers, ...options });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Server xatosi' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  };

  return { request, headers };
};

function Toast({ toasts, removeToast }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => removeToast(t.id)}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem('hr_auth');
    return saved ? JSON.parse(saved) : null;
  });
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const login = (data) => {
    localStorage.setItem('hr_auth', JSON.stringify(data));
    setAuth(data);
  };

  const logout = () => {
    localStorage.removeItem('hr_auth');
    setAuth(null);
  };

  if (!auth) {
    return (
      <>
        <Login onLogin={login} addToast={addToast} />
        <Toast toasts={toasts} removeToast={() => {}} />
      </>
    );
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, addToast }}>
      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/candidates" element={<CandidateList />} />
            <Route path="/candidates/:id" element={<CandidateProfile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/mock-form" element={<MockForm />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <Toast toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </AuthContext.Provider>
  );
}
