import React, { useState, useEffect } from 'react';
import { useApi, useAuth } from '../App';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', full_name: '', email: '', role: 'hr_manager' });
  const [saving, setSaving] = useState(false);
  const { request, addToast, role } = useAuth();

  const fetchUsers = async () => {
    try {
      const data = await request('/users');
      setUsers(data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleOpen = (user = null) => {
    if (user) {
      setEditUser(user);
      setForm({ username: user.username, password: '', full_name: user.full_name || '', email: user.email || '', role: user.role });
    } else {
      setEditUser(null);
      setForm({ username: '', password: '', full_name: '', email: '', role: 'hr_manager' });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.username) return addToast('Foydalanuvchi nomi talab qilinadi', 'error');
    if (!editUser && !form.password) return addToast('Parol talab qilinadi', 'error');
    setSaving(true);
    try {
      if (editUser) {
        const body = { full_name: form.full_name, email: form.email, role: form.role };
        if (form.password) body.password = form.password;
        await request(`/users/${editUser.id}`, { method: 'PUT', body: JSON.stringify(body) });
        addToast('Foydalanuvchi yangilandi', 'success');
      } else {
        await request('/users', { method: 'POST', body: JSON.stringify(form) });
        addToast('Foydalanuvchi yaratildi', 'success');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`${user.username} foydalanuvchisini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await request(`/users/${user.id}`, { method: 'DELETE' });
      addToast('Foydalanuvchi o\'chirildi', 'success');
      fetchUsers();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (role !== 'administrator') {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔒</div>
        <h3>Ruxsat yo'q</h3>
        <p>Faqat administratorlar foydalanuvchilarni boshqara oladi.</p>
      </div>
    );
  }

  if (loading) return <div className="loading"><div className="spinner" /> Yuklanmoqda...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Foydalanuvchilar</h1>
          <p>Tizim foydalanuvchilarini boshqarish</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpen()}>+ Yangi foydalanuvchi</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Foydalanuvchi</th>
              <th>To'liq ism</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Yaratilgan</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>{u.username}</td>
                <td>{u.full_name || '-'}</td>
                <td style={{ fontSize: 13 }}>{u.email || '-'}</td>
                <td>
                  <span className={`status-badge ${u.role === 'administrator' ? 'status-high-potential' : 'status-rezerv'}`}>
                    {u.role === 'administrator' ? 'Administrator' : 'HR Menejer'}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>{new Date(u.created_at).toLocaleDateString('uz-UZ')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpen(u)}>Tahrirlash</button>
                    {u.username !== 'admin' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)}>O'chirish</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editUser ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi'}</h2>
            <div className="form-group">
              <label>Foydalanuvchi nomi</label>
              <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} disabled={!!editUser} />
            </div>
            <div className="form-group">
              <label>{editUser ? "Yangi parol (bo'sh qoldirilsa o'zgarermas)" : 'Parol'}</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="form-group">
              <label>To'liq ism</label>
              <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Rol</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="hr_manager">HR Menejer</option>
                <option value="administrator">Administrator</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
