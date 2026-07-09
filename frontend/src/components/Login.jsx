import React, { useState } from 'react';

export default function Login({ onLogin, addToast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onLogin(data);
      addToast('Xush kelibsiz!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>HR Rezerv Tizimi</h1>
        <p>Nomzodlarni boshqarish tizimiga xush kelibsiz</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Foydalanuvchi nomi</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Parol</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="admin123"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Kirish...' : 'Kirish'}
          </button>
        </form>
        <p style={{ marginTop: 20, fontSize: 12, color: 'var(--gray-400)', textAlign: 'center' }}>
          Administrator: admin / admin123
        </p>
      </div>
    </div>
  );
}
