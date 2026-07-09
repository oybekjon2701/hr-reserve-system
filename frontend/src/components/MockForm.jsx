import React, { useState } from 'react';
import { useAuth, useApi } from '../App';

const FORM_FIELDS = [
  { key: 'to\'liq_ism-sharif', label: "To'liq ism-sharif", type: 'text', required: true },
  { key: 'tug\'ilgan_sana', label: "Tug'ilgan sana", type: 'date' },
  { key: 'jinsi', label: 'Jinsi', type: 'select', options: ['', 'Erkak', 'Ayol'] },
  { key: 'telefon_raqami', label: 'Telefon raqami', type: 'text' },
  { key: 'elektron_pochta', label: 'Elektron pochta', type: 'email' },
  { key: 'yashash_manzili', label: 'Yashash manzili', type: 'text' },
  { key: 'ta\'lim_darajasi', label: "Ta'lim darajasi", type: 'select', options: ['', "O'rta", "O'rta maxsus", "Oliy (bakalavr)", "Oliy (magistr)", "Oliy (doktorantura)"] },
  { key: 'oliy_ta\'lim_muassasi_nomi', label: "Oliy ta'lim muassasi nomi", type: 'text' },
  { key: 'mutaxassislik_yo\'nalishi', label: "Mutaxassislik yo'nalishi", type: 'text' },
  { key: 'bitirgan_yili', label: 'Bitirgan yili', type: 'text' },
  { key: 'umumiy_ish_tajribasi', label: 'Umumiy ish tajribasi (yil)', type: 'number' },
  { key: 'oxirgi_ish_joyi', label: 'Oxirgi ish joyi', type: 'text' },
  { key: 'lavozimi', label: 'Lavozimi', type: 'text' },
  { key: 'ishdan_ketish_sababi', label: 'Ishdan ketish sababi', type: 'text' },
  { key: 'kompyuter_dasturlari_bilan_ishlash_darajasi', label: "Kompyuter dasturlari bilan ishlash darajasi", type: 'select', options: ['', 'Yuqori', "O'rta", 'Past', 'Bilmayman'] },
  { key: 'qaysi_dasturlarni_bilasiz', label: "Qaysi dasturlarni bilasiz?", type: 'text', placeholder: 'Excel, Word, 1C, ...' },
  { key: 'chet_tillarini_bilish_darajasi', label: "Chet tillarini bilish darajasi", type: 'text', placeholder: 'Ingliz tili: yuqori, Rus tili: o\'rta' },
  { key: 'qaysi_lavozimda_ishlamoqchisiz', label: "Qaysi lavozimda ishlamoqchisiz?", type: 'text' },
  { key: 'kutilayotgan_maosh', label: 'Kutilayotgan maosh', type: 'text', placeholder: 'So\'mda' },
  { key: 'qachondan_ishni_boshlashingiz_mumkin', label: "Qachondan ishni boshlashingiz mumkin?", type: 'text', placeholder: 'Darhol, 1 haftada, ...' },
  { key: 'to\'liq_stavkada_ishlashga_tayyormisiz', label: "To'liq stavkada ishlashga tayyormisiz?", type: 'select', options: ['', 'Ha', "Yo'q"] }
];

export default function MockForm() {
  const [formData, setFormData] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useAuth();

  const setField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/webhook/google-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setResult(data);
      if (data.status === 'success') {
        addToast('Nomzod muvaffaqiyatli qo\'shildi!', 'success');
      } else if (data.status === 'duplicate') {
        addToast('Takroriy nomzod aniqlandi', 'warning');
      } else {
        addToast(data.error || 'Xatolik yuz berdi', 'error');
      }
    } catch (err) {
      addToast('Serverga ulanishda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillSample = () => {
    setFormData({
      'to\'liq_ism-sharif': 'Aliyev Vali',
      'tug\'ilgan_sana': '1995-05-15',
      'jinsi': 'Erkak',
      'telefon_raqami': '+998901234567',
      'elektron_pochta': 'vali@example.com',
      'yashash_manzili': 'Toshkent shahri',
      'ta\'lim_darajasi': "Oliy (bakalavr)",
      'oliy_ta\'lim_muassasi_nomi': 'Toshkent Davlat Universiteti',
      'mutaxassislik_yo\'nalishi': 'Iqtisodiyot',
      'bitirgan_yili': '2017',
      'umumiy_ish_tajribasi': '5',
      'oxirgi_ish_joyi': 'OOO "Korxona"',
      'lavozimi': 'Buxgalter',
      'ishdan_ketish_sababi': 'Ko\'chib ketish',
      'kompyuter_dasturlari_bilan_ishlash_darajasi': 'Yuqori',
      'qaysi_dasturlarni_bilasiz': 'Excel, Word, 1C, Bank mijoz',
      'chet_tillarini_bilish_darajasi': 'Ingliz tili: o\'rta, Rus tili: yuqori',
      'qaysi_lavozimda_ishlamoqchisiz': 'Buxgalter',
      'kutilayotgan_maosh': '5 000 000 so\'m',
      'qachondan_ishni_boshlashingiz_mumkin': 'Darhol',
      'to\'liq_stavkada_ishlashga_tayyormisiz': 'Ha'
    });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Google Forms sinov</h1>
          <p>Google Forms ma'lumotlarini simulyatsiya qilish</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={fillSample}>Namuna bilan to'ldirish</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="table-container" style={{ padding: 24 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {FORM_FIELDS.map(field => (
                <div key={field.key} className="form-group" style={{ marginBottom: 0 }}>
                  <label>{field.label}</label>
                  {field.type === 'select' ? (
                    <select value={formData[field.key] || ''} onChange={e => setField(field.key, e.target.value)}>
                      {field.options.map(o => <option key={o} value={o}>{o || 'Tanlang...'}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={e => setField(field.key, e.target.value)}
                      placeholder={field.placeholder || ''}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 20 }} disabled={loading}>
              {loading ? 'Yuborilmoqda...' : "Google Forms ma'lumotlarini yuborish"}
            </button>
          </form>
        </div>

        <div>
          {result && (
            <div className="chart-card">
              <h3>Natija</h3>
              <pre style={{ fontSize: 13, color: 'var(--gray-600)', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                {JSON.stringify(result, null, 2)}
              </pre>
              {result.candidate_id && (
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 12 }}
                  onClick={() => window.location.href = `/candidates/${result.candidate_id}`}
                >
                  Nomzod profilini ko'rish
                </button>
              )}
            </div>
          )}
          {!result && (
            <div className="chart-card">
              <h3>Yordam</h3>
              <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.7 }}>
                Ushbu forma Google Forms so'rovnomasini simulyatsiya qiladi.
                Ma'lumotlarni to'ldiring va "Yuborish" tugmasini bosing.
              </p>
              <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.7, marginTop: 12 }}>
                Tizim avtomatik ravishda:
              </p>
              <ul style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.7, paddingLeft: 20, marginTop: 8 }}>
                <li>Ma'lumotlarni validatsiya qiladi</li>
                <li>Dublikatlarni tekshiradi</li>
                <li>Nomzod profilini yaratadi</li>
                <li>AI ball hisoblaydi (0-100)</li>
                <li>Avtomatik teglar yaratadi</li>
                <li>AI xulosa yozadi</li>
                <li>HR bildirishnoma yuboradi</li>
              </ul>
              <p style={{ fontSize: 14, color: 'var(--gray-600)', marginTop: 12 }}>
                Haqiqiy Google Forms bilan ishlash uchun
                Google Forms sozlamalarida "Response webhook" ga quyidagi manzilni kiriting:
              </p>
              <code style={{ display: 'block', padding: 12, background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', marginTop: 8, fontSize: 12 }}>
                POST /api/webhook/google-forms
              </code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
