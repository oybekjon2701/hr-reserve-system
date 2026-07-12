import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../App';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#8b5cf6', '#ec4899', '#14b8a6', '#6b7280'];
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

const statusClass = (s) => {
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

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { request } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    request('/dashboard/stats')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /> Yuklanmoqda...</div>;
  if (!stats) return <div className="empty-state"><h3>Ma'lumot topilmadi</h3><p>Hali nomzodlar mavjud emas.</p></div>;

  const statusData = Object.entries(stats.statuses || {}).map(([name, value]) => ({ name: STATUS_LABELS[name] || name, value }));

  const statCards = [
    { label: 'Jami nomzodlar', value: stats.total, color: '#2563eb', bg: '#eff6ff', icon: '👥' },
    { label: "Bugun qo'shilgan", value: stats.today, color: '#16a34a', bg: '#f0fdf4', icon: '📥' },
    { label: 'Shu oy qo\'shilgan', value: stats.this_month, color: '#8b5cf6', bg: '#f5f3ff', icon: '📊' },
    { label: 'Yuqori salohiyat', value: stats.high_potential, color: '#f59e0b', bg: '#fffbeb', icon: '⭐' },
    { label: "O'rtacha ball", value: Math.round(stats.avg_score), color: '#14b8a6', bg: '#f0fdfa', icon: '📈' },
    { label: 'Kutilayotgan nomzodlar', value: stats.stale_candidates, color: '#dc2626', bg: '#fef2f2', icon: '⏰' },
    { label: 'Bildirishnomalar', value: stats.unread_notifications, color: '#f59e0b', bg: '#fffbeb', icon: '🔔' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>HR tizimining umumiy ko'rinishi</p>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card" style={{ borderLeft: `3px solid ${card.color}` }}>
            <div className="stat-icon" style={{ background: card.bg }}>{card.icon}</div>
            <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Status bo'yicha</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Oylik arizalar</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.monthly_applications}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Ta'lim darajasi</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.education_distribution} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#16a34a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Ball taqsimoti</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={stats.score_distribution} dataKey="value" nameKey="range" cx="50%" cy="50%" outerRadius={80} label={({ range, percent }) => `${range} ${(percent * 100).toFixed(0)}%`}>
                {stats.score_distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Ish tajribasi</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.experience_distribution}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Lavozim bo'yicha (top 10)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.position_distribution} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card">
        <h3>Oxirgi nomzodlar</h3>
        <table>
          <thead>
            <tr>
              <th>F.I.O.</th>
              <th>Status</th>
              <th>Ball</th>
              <th>Lavozim</th>
              <th>Sana</th>
            </tr>
          </thead>
          <tbody>
            {stats.recent_candidates.map(c => (
              <tr key={c.id} onClick={() => navigate(`/candidates/${c.id}`)} style={{ cursor: 'pointer' }}>
                <td style={{ fontWeight: 500 }}>{c.full_name}</td>
                <td><span className={`status-badge ${statusClass(c.status)}`}>{STATUS_LABELS[c.status] || c.status}</span></td>
                <td>
                  <span className={`score-badge score-${c.score >= 70 ? 'high' : c.score >= 40 ? 'mid' : 'low'}`}>
                    {c.score}
                  </span>
                </td>
                <td>{c.desired_position || '-'}</td>
                <td style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                  {new Date(c.created_at).toLocaleDateString('uz-UZ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
