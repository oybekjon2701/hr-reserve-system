import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

const STATUSES = Object.keys(STATUS_LABELS);

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

export default function CandidateList() {
  const [data, setData] = useState({ candidates: [], pagination: { page: 1, total: 0, total_pages: 1 } });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [page, setPage] = useState(1);
  const { request } = useApi();
  const navigate = useNavigate();

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort_by: sortBy, page, limit: 20 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const result = await request(`/candidates?${params}`);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortBy, page]);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  const handleExport = async (format) => {
    try {
      if (format === 'json') {
        const res = await fetch(`/api/candidates/export/json`, { headers: { Authorization: `Bearer ${localStorage.getItem('hr_auth') ? JSON.parse(localStorage.getItem('hr_auth')).token : ''}` } });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `nomzodlar.${format}`; a.click();
        URL.revokeObjectURL(url);
      } else {
        window.open(`/api/candidates/export/${format}`, '_blank');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const { candidates, pagination } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Nomzodlar</h1>
          <p>Jami {pagination.total} nomzod</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => handleExport('csv')}>CSV yuklab olish</button>
          <button className="btn btn-ghost btn-sm" onClick={() => handleExport('json')}>JSON yuklab olish</button>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <input
            className="search-input"
            placeholder="Ism, telefon, email bo'yicha qidirish..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Barcha statuslar</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="created_at">Eng yangi</option>
            <option value="score">Eng yuqori ball</option>
            <option value="total_experience">Tajriba</option>
            <option value="full_name">Ism</option>
          </select>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /> Yuklanmoqda...</div>
        ) : candidates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>Nomzod topilmadi</h3>
            <p>Google Form orqali nomzod qo'shing yoki qidiruv parametrlarini o'zgartiring.</p>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>F.I.O.</th>
                  <th>Telefon</th>
                  <th>Lavozim</th>
                  <th>Tajriba</th>
                  <th>Ta'lim</th>
                  <th>Ball</th>
                  <th>Status</th>
                  <th>Sana</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map(c => (
                  <tr key={c.id} onClick={() => navigate(`/candidates/${c.id}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 500 }}>{c.full_name}</td>
                    <td style={{ fontSize: 13 }}>{c.phone || '-'}</td>
                    <td style={{ fontSize: 13 }}>{c.desired_position || '-'}</td>
                    <td style={{ fontSize: 13 }}>{c.total_experience ? `${c.total_experience} yil` : '-'}</td>
                    <td style={{ fontSize: 13 }}>{c.education_level || '-'}</td>
                    <td>
                      <span className={`score-badge score-${c.score >= 70 ? 'high' : c.score >= 40 ? 'mid' : 'low'}`}>
                        {c.score}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${statusClass(c.status)}`}>
                        {STATUS_LABELS[c.status] || c.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                      {new Date(c.created_at).toLocaleDateString('uz-UZ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              <span>
                {pagination.total === 0 ? '0 ta natija' : `${(pagination.page - 1) * pagination.limit + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} / ${pagination.total}`}
              </span>
              <div className="pagination-btns">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Oldingi</button>
                {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.total_pages || Math.abs(p - page) <= 2)
                  .map((p, i, arr) => (
                    <React.Fragment key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && <span style={{ padding: '6px 4px' }}>...</span>}
                      <button className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                    </React.Fragment>
                  ))}
                <button disabled={page >= pagination.total_pages} onClick={() => setPage(p => p + 1)}>Keyingi</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
