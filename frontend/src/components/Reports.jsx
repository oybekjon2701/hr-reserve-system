import React, { useState, useEffect } from 'react';
import { useApi } from '../App';

const REPORT_TYPES = [
  { id: 'status', label: 'Status bo\'yicha', icon: '📊' },
  { id: 'education', label: 'Ta\'lim bo\'yicha', icon: '🎓' },
  { id: 'experience', label: 'Tajriba bo\'yicha', icon: '💼' },
  { id: 'position', label: 'Lavozim bo\'yicha', icon: '📋' },
  { id: 'score', label: 'Ball bo\'yicha', icon: '⭐' },
  { id: 'monthly', label: 'Oylik', icon: '📅' },
];

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('status');
  const { request, addToast } = useApi();

  useEffect(() => {
    request('/dashboard/stats')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async (format) => {
    try {
      const token = JSON.parse(localStorage.getItem('hr_auth')).token;
      const res = await fetch(`/api/candidates/export/${format}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export xatosi');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nomzodlar_${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      addToast(`${format.toUpperCase()} fayli yuklab olindi`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /> Yuklanmoqda...</div>;
  if (!stats) return <div className="empty-state"><h3>Ma'lumot topilmadi</h3></div>;

  const renderReport = () => {
    switch (selectedReport) {
      case 'status':
        return (
          <div>
            <h3 style={{ marginBottom: 16 }}>Status bo'yicha hisobot</h3>
            <table>
              <thead><tr><th>Status</th><th>Soni</th><th>Foiz</th></tr></thead>
              <tbody>
                {Object.entries(stats.statuses || {}).map(([status, count]) => {
                  const labels = { 'yangi': 'Yangi', "ko'rib chiqilmoqda": "Ko'rib chiqilmoqda", 'rezerv': 'Rezerv', 'yuqori salohiyat': 'Yuqori salohiyat', 'suhbatga chaqirilgan': "Suhbatga chaqirilgan", 'ishga qabul qilingan': "Ishga qabul qilingan", 'rad etilgan': 'Rad etilgan', 'faol emas': 'Faol emas' };
                  return (
                    <tr key={status}>
                      <td style={{ fontWeight: 500 }}>{labels[status] || status}</td>
                      <td>{count}</td>
                      <td>{stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      case 'education':
        return (
          <div>
            <h3 style={{ marginBottom: 16 }}>Ta'lim darajasi bo'yicha</h3>
            <table>
              <thead><tr><th>Ta'lim darajasi</th><th>Soni</th><th>Foiz</th></tr></thead>
              <tbody>
                {(stats.education_distribution || []).map(e => (
                  <tr key={e.name}>
                    <td style={{ fontWeight: 500 }}>{e.name}</td>
                    <td>{e.value}</td>
                    <td>{stats.total > 0 ? ((e.value / stats.total) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'experience':
        return (
          <div>
            <h3 style={{ marginBottom: 16 }}>Ish tajribasi bo'yicha</h3>
            <table>
              <thead><tr><th>Tajriba</th><th>Soni</th><th>Foiz</th></tr></thead>
              <tbody>
                {(stats.experience_distribution || []).map(e => (
                  <tr key={e.name}>
                    <td style={{ fontWeight: 500 }}>{e.name}</td>
                    <td>{e.value}</td>
                    <td>{stats.total > 0 ? ((e.value / stats.total) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'position':
        return (
          <div>
            <h3 style={{ marginBottom: 16 }}>Lavozim bo'yicha</h3>
            <table>
              <thead><tr><th>Lavozim</th><th>Soni</th><th>Foiz</th></tr></thead>
              <tbody>
                {(stats.position_distribution || []).map(p => (
                  <tr key={p.name}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td>{p.value}</td>
                    <td>{stats.total > 0 ? ((p.value / stats.total) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'score':
        return (
          <div>
            <h3 style={{ marginBottom: 16 }}>Ball taqsimoti</h3>
            <table>
              <thead><tr><th>Ball oralig'i</th><th>Soni</th><th>Foiz</th></tr></thead>
              <tbody>
                {(stats.score_distribution || []).map(s => (
                  <tr key={s.range}>
                    <td style={{ fontWeight: 500 }}>{s.range}</td>
                    <td>{s.value}</td>
                    <td>{stats.total > 0 ? ((s.value / stats.total) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'monthly':
        return (
          <div>
            <h3 style={{ marginBottom: 16 }}>Oylik arizalar</h3>
            <table>
              <thead><tr><th>Oy</th><th>Soni</th></tr></thead>
              <tbody>
                {(stats.monthly_applications || []).map(m => (
                  <tr key={m.month}>
                    <td style={{ fontWeight: 500 }}>{m.month}</td>
                    <td>{m.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Hisobotlar</h1>
          <p>Nomzodlar bo'yicha tahliliy hisobotlar</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => handleExport('csv')}>CSV yuklab olish</button>
          <button className="btn btn-ghost btn-sm" onClick={() => handleExport('json')}>JSON yuklab olish</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20 }}>
        <div className="table-container" style={{ padding: 12, height: 'fit-content' }}>
          {REPORT_TYPES.map(r => (
            <button
              key={r.id}
              className={`filter-btn ${selectedReport === r.id ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={() => setSelectedReport(r.id)}
            >
              <span>{r.icon}</span> {r.label}
            </button>
          ))}
        </div>

        <div className="table-container" style={{ padding: 24 }}>
          {renderReport()}
        </div>
      </div>

      <div className="chart-card" style={{ marginTop: 20 }}>
        <h3>Umumiy ko'rsatkichlar</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 12 }}>
          <div style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>{stats.total}</div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Jami nomzodlar</div>
          </div>
          <div style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>{Math.round(stats.avg_score || 0)}</div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>O'rtacha ball</div>
          </div>
          <div style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning)' }}>{stats.high_potential}</div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Yuqori salohiyat</div>
          </div>
          <div style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--danger)' }}>{stats.stale_candidates}</div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Kutilayotgan</div>
          </div>
        </div>
      </div>
    </div>
  );
}
