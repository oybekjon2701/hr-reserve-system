import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi, useAuth } from '../App';

const STATUS_LABELS = {
  'yangi': 'Yangi',
  "ko'rib chiqilmoqda": "Ko'rib chiqilmoqda",
  'rezerv': 'Rezerv',
  'yuqori salohiyat': 'Yuqori salohiyat',
  'suhbatga chaqirilgan': "Suhbatga chaqirilgan",
  'ishga qabul qilingan': "Ishga qabul qilingan",
  'rad etilgan': 'Rad etilgan',
  'faol emas': 'Faol emas'
};

const STATUS_FLOW = ['yangi', "ko'rib chiqilmoqda", 'rezerv', 'yuqori salohiyat', 'suhbatga chaqirilgan'];

export default function CandidateProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { request, addToast } = useApi();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [noteModal, setNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDesc, setNoteDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    request(`/candidates/${id}`)
      .then(setCandidate)
      .catch(() => { addToast('Nomzod topilmadi', 'error'); navigate('/candidates'); })
      .finally(() => setLoading(false));
  }, [id]);

  const statusColors = (s) => {
    const map = {
      'yangi': 'status-yangi',
      "ko'rib chiqilmoqda": 'status-under-review',
      'rezerv': 'status-rezerv',
      'yuqori salohiyat': 'status-high-potential',
      'suhbatga chaqirilgan': 'status-interview',
      'ishga qabul qilingan': 'status-hired',
      'rad etilgan': 'status-rejected',
      'faol emas': 'status-inactive'
    };
    return map[s] || '';
  };

  const handleStatusChange = async () => {
    if (!newStatus) return;
    setSaving(true);
    try {
      await request(`/candidates/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus, note: statusNote })
      });
      setCandidate(prev => ({ ...prev, status: newStatus }));
      addToast('Status yangilandi', 'success');
      setStatusModal(false);
      setStatusNote('');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteTitle) return;
    setSaving(true);
    try {
      await request(`/candidates/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ title: noteTitle, description: noteDesc })
      });
      addToast('Eslatma qo\'shildi', 'success');
      setNoteModal(false);
      setNoteTitle('');
      setNoteDesc('');
      const updated = await request(`/candidates/${id}`);
      setCandidate(updated);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Nomzodni o\'chirishni tasdiqlaysizmi?')) return;
    try {
      await request(`/candidates/${id}`, { method: 'DELETE' });
      addToast('Nomzod o\'chirildi', 'success');
      navigate('/candidates');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /> Yuklanmoqda...</div>;
  if (!candidate) return null;

  const c = candidate;
  const breakdown = c.score_breakdown || {};
  const tags = c.tags || [];
  const initials = c.full_name ? c.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';

  return (
    <div className="profile-container">
      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/candidates')}>← Nomzodlar ro'yxati</button>
      </div>

      <div className="profile-header">
        <div className="profile-avatar">{initials}</div>
        <div className="profile-info" style={{ flex: 1 }}>
          <h1>{c.full_name}</h1>
          <div className="profile-meta">
            <span>📧 {c.email || '-'}</span>
            <span>📞 {c.phone || '-'}</span>
            <span>📍 {c.address || '-'}</span>
            <span>🎂 {c.birth_date || '-'}</span>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <span className={`status-badge ${statusColors(c.status)}`}>{STATUS_LABELS[c.status] || c.status}</span>
            <span className={`score-badge score-${c.score >= 70 ? 'high' : c.score >= 40 ? 'mid' : 'low'}`}>
              {c.score}/100
            </span>
            <button className="btn btn-primary btn-sm" onClick={() => { setNewStatus(c.status); setStatusModal(true); }}>
              Statusni o'zgartirish
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setNoteModal(true)}>Eslatma qo'shish</button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>O'chirish</button>
          </div>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="profile-section" style={{ marginBottom: 16, padding: '12px 20px' }}>
          {tags.map((tag, i) => (
            <span key={i} className="tag tag-primary">{tag}</span>
          ))}
        </div>
      )}

      <div className="profile-sections">
        {c.summary && (
          <div className="profile-section">
            <h3>AI Xulosa</h3>
            <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.7 }}>{c.summary}</p>
          </div>
        )}

        <div className="profile-section">
          <h3>Shaxsiy ma'lumotlar</h3>
          <div className="profile-field"><span className="field-label">To'liq ism</span><span className="field-value">{c.full_name}</span></div>
          <div className="profile-field"><span className="field-label">Tug'ilgan sana</span><span className="field-value">{c.birth_date || '-'}</span></div>
          <div className="profile-field"><span className="field-label">Jinsi</span><span className="field-value">{c.gender || '-'}</span></div>
          <div className="profile-field"><span className="field-label">Telefon</span><span className="field-value">{c.phone || '-'}</span></div>
          <div className="profile-field"><span className="field-label">Email</span><span className="field-value">{c.email || '-'}</span></div>
          <div className="profile-field"><span className="field-label">Manzil</span><span className="field-value">{c.address || '-'}</span></div>
        </div>

        <div className="profile-section">
          <h3>Ta'lim</h3>
          <div className="profile-field"><span className="field-label">Darajasi</span><span className="field-value">{c.education_level || '-'}</span></div>
          <div className="profile-field"><span className="field-label">Universitet</span><span className="field-value">{c.university || '-'}</span></div>
          <div className="profile-field"><span className="field-label">Mutaxassislik</span><span className="field-value">{c.specialty || '-'}</span></div>
          <div className="profile-field"><span className="field-label">Bitirgan yili</span><span className="field-value">{c.graduation_year || '-'}</span></div>
        </div>

        <div className="profile-section">
          <h3>Ish tajribasi</h3>
          <div className="profile-field"><span className="field-label">Umumiy tajriba</span><span className="field-value">{c.total_experience ? `${c.total_experience} yil` : '-'}</span></div>
          <div className="profile-field"><span className="field-label">Oxirgi ish joyi</span><span className="field-value">{c.last_workplace || '-'}</span></div>
          <div className="profile-field"><span className="field-label">Lavozimi</span><span className="field-value">{c.last_position || '-'}</span></div>
          <div className="profile-field"><span className="field-label">Ketish sababi</span><span className="field-value">{c.resignation_reason || '-'}</span></div>
        </div>

        <div className="profile-section">
          <h3>Ko'nikmalar</h3>
          <div className="profile-field"><span className="field-label">Kompyuter darajasi</span><span className="field-value">{c.computer_skill_level || '-'}</span></div>
          <div className="profile-field"><span className="field-label">Dasturlar</span><span className="field-value">{c.known_programs || '-'}</span></div>
          <div className="profile-field"><span className="field-label">Tillar</span><span className="field-value">{c.language_skills || '-'}</span></div>
        </div>

        <div className="profile-section">
          <h3>Ish afzalliklari</h3>
          <div className="profile-field"><span className="field-label">Kerakli lavozim</span><span className="field-value">{c.desired_position || '-'}</span></div>
          <div className="profile-field"><span className="field-label">Kutilgan maosh</span><span className="field-value">{c.expected_salary || '-'}</span></div>
          <div className="profile-field"><span className="field-label">Ish boshlash</span><span className="field-value">{c.availability || '-'}</span></div>
          <div className="profile-field"><span className="field-label">To'liq stavka</span><span className="field-value">{c.ready_full_time || '-'}</span></div>
        </div>

        <div className="profile-section">
          <h3>Ball hisobi ({c.score}/100)</h3>
          {Object.values(breakdown).length > 0 ? (
            Object.entries(breakdown).map(([key, b]) => (
              <div key={key} className="breakdown-bar">
                <span className="bar-label">{b.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(b.score / b.max) * 100}%`, background: b.score >= b.max * 0.7 ? '#16a34a' : b.score >= b.max * 0.4 ? '#f59e0b' : '#dc2626' }} />
                </div>
                <span className="bar-value">{b.score}/{b.max}</span>
              </div>
            ))
          ) : (
            <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>Ball tahlili mavjud emas</p>
          )}
        </div>

        {c.notes && typeof c.notes === 'string' && c.notes.length > 0 && (
          <div className="profile-section">
            <h3>HR Eslatmalari</h3>
            <p style={{ fontSize: 14, color: 'var(--gray-600)', whiteSpace: 'pre-wrap' }}>{c.notes}</p>
          </div>
        )}

        {c.history && c.history.length > 0 && (
          <div className="profile-section">
            <h3>Status tarixi</h3>
            {c.history.map((h, i) => (
              <div key={h.id} className="profile-field">
                <span className="field-label" style={{ width: 160, fontSize: 12 }}>
                  {new Date(h.created_at).toLocaleString('uz-UZ')}
                </span>
                <span className="field-value">
                  {h.from_status ? <><span className={`status-badge ${statusColors(h.from_status)}`} style={{ fontSize: 11, padding: '2px 8px' }}>{STATUS_LABELS[h.from_status]}</span> → </> : ''}
                  <span className={`status-badge ${statusColors(h.to_status)}`} style={{ fontSize: 11, padding: '2px 8px' }}>{STATUS_LABELS[h.to_status]}</span>
                  {h.changed_by_name && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--gray-400)' }}>{h.changed_by_name}</span>}
                  {h.note && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--gray-500)' }}>- {h.note}</span>}
                </span>
              </div>
            ))}
          </div>
        )}

        {c.reminders && c.reminders.length > 0 && (
          <div className="profile-section">
            <h3>Eslatmalar</h3>
            {c.reminders.map((n) => (
              <div key={n.id} className="profile-field">
                <span className="field-label" style={{ width: 140, fontSize: 12 }}>
                  {new Date(n.created_at).toLocaleDateString('uz-UZ')}
                </span>
                <span className="field-value">
                  <strong>{n.title}</strong>
                  {n.description && <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>{n.description}</p>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Change Modal */}
      {statusModal && (
        <div className="modal-overlay" onClick={() => setStatusModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Statusni o'zgartirish</h2>
            <div className="form-group">
              <label>Yangi status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Izoh (ixtiyoriy)</label>
              <textarea value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="Status o'zgarishi sababi..." />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setStatusModal(false)}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={handleStatusChange} disabled={saving}>
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {noteModal && (
        <div className="modal-overlay" onClick={() => setNoteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Eslatma qo'shish</h2>
            <div className="form-group">
              <label>Sarlavha</label>
              <input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="Eslatma sarlavhasi" />
            </div>
            <div className="form-group">
              <label>Tavsif</label>
              <textarea value={noteDesc} onChange={e => setNoteDesc(e.target.value)} placeholder="Eslatma matni..." />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setNoteModal(false)}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={handleAddNote} disabled={saving}>
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
