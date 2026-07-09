const express = require('express');
const { queryAll, queryOne, queryRun } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function tryParseJSON(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

function mapCandidate(c) {
  return {
    ...c,
    tags: tryParseJSON(c.tags, []),
    score_breakdown: tryParseJSON(c.score_breakdown, {}),
    ai_analysis: tryParseJSON(c.ai_analysis, {})
  };
}

// List candidates with search/filter/sort/pagination
router.get('/', (req, res) => {
  try {
    const {
      search, status, education_level, min_score, max_score,
      experience_min, experience_max, university, desired_position,
      language_skills, availability, sort_by, sort_order, page, limit
    } = req.query;

    let where = [];
    let params = [];

    if (search) {
      where.push('(full_name LIKE ? OR phone LIKE ? OR email LIKE ? OR desired_position LIKE ? OR university LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }
    if (status) { where.push('status = ?'); params.push(status); }
    if (education_level) { where.push('education_level LIKE ?'); params.push(`%${education_level}%`); }
    if (min_score) { where.push('score >= ?'); params.push(parseInt(min_score)); }
    if (max_score) { where.push('score <= ?'); params.push(parseInt(max_score)); }
    if (experience_min) { where.push('CAST(total_experience AS REAL) >= ?'); params.push(parseFloat(experience_min)); }
    if (experience_max) { where.push('CAST(total_experience AS REAL) <= ?'); params.push(parseFloat(experience_max)); }
    if (university) { where.push('university LIKE ?'); params.push(`%${university}%`); }
    if (desired_position) { where.push('desired_position LIKE ?'); params.push(`%${desired_position}%`); }
    if (language_skills) { where.push('language_skills LIKE ?'); params.push(`%${language_skills}%`); }
    if (availability) { where.push('availability LIKE ?'); params.push(`%${availability}%`); }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const validSorts = ['score', 'created_at', 'full_name', 'total_experience', 'status'];
    const sortCol = validSorts.includes(sort_by) ? sort_by : 'created_at';
    const order = sort_order === 'asc' ? 'ASC' : 'DESC';

    const countResult = queryOne(`SELECT COUNT(*) as total FROM candidates ${whereClause}`, params);
    const total = countResult ? countResult.total : 0;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const offset = (pageNum - 1) * limitNum;

    const candidates = queryAll(
      `SELECT * FROM candidates ${whereClause} ORDER BY ${sortCol} ${order} LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    ).map(mapCandidate);

    res.json({
      candidates,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single candidate with history and notes
router.get('/:id', (req, res) => {
  try {
    const candidate = queryOne('SELECT * FROM candidates WHERE id = ?', [req.params.id]);
    if (!candidate) return res.status(404).json({ error: 'Nomzod topilmadi' });

    const history = queryAll(
      `SELECT sh.*, u.full_name as changed_by_name
       FROM status_history sh
       LEFT JOIN users u ON sh.changed_by = u.id
       WHERE sh.candidate_id = ?
       ORDER BY sh.created_at DESC`, [req.params.id]
    );

    const notes = queryAll(
      `SELECT r.*, u.full_name as created_by_name
       FROM reminders r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.candidate_id = ?
       ORDER BY r.created_at DESC`, [req.params.id]
    );

    res.json({ ...mapCandidate(candidate), history, notes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update candidate status
router.put('/:id/status', (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = [
      'yangi', 'ko\'rib chiqilmoqda', 'rezerv', 'yuqori salohiyat',
      'suhbatga chaqirilgan', 'ishga qabul qilingan', 'rad etilgan', 'faol emas'
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Noto'g'ri status. Ruxsat etilgan: ${validStatuses.join(', ')}` });
    }

    const candidate = queryOne('SELECT status FROM candidates WHERE id = ?', [req.params.id]);
    if (!candidate) return res.status(404).json({ error: 'Nomzod topilmadi' });

    const oldStatus = candidate.status;
    queryRun('UPDATE candidates SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);
    queryRun(
      'INSERT INTO status_history (candidate_id, from_status, to_status, changed_by, note) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, oldStatus, status, req.user.id, note || '']
    );

    res.json({ message: 'Status muvaffaqiyatli yangilandi', from: oldStatus, to: status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update candidate fields
router.put('/:id', (req, res) => {
  try {
    const candidate = queryOne('SELECT id FROM candidates WHERE id = ?', [req.params.id]);
    if (!candidate) return res.status(404).json({ error: 'Nomzod topilmadi' });

    const allowed = [
      'full_name', 'birth_date', 'gender', 'phone', 'email', 'address',
      'education_level', 'university', 'specialty', 'graduation_year',
      'total_experience', 'last_workplace', 'last_position', 'resignation_reason',
      'computer_skill_level', 'known_programs', 'language_skills',
      'desired_position', 'expected_salary', 'availability', 'ready_full_time',
      'notes'
    ];

    const updates = [];
    const params = [];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Yangilanadigan maydonlar topilmadi' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    queryRun(`UPDATE candidates SET ${updates.join(', ')} WHERE id = ?`, params);
    const updated = queryOne('SELECT * FROM candidates WHERE id = ?', [req.params.id]);
    res.json(mapCandidate(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add note (reminder)
router.post('/:id/notes', (req, res) => {
  try {
    const { title, description, due_date } = req.body;
    if (!title) return res.status(400).json({ error: 'Eslatma sarlavhasi talab qilinadi' });

    const candidate = queryOne('SELECT id FROM candidates WHERE id = ?', [req.params.id]);
    if (!candidate) return res.status(404).json({ error: 'Nomzod topilmadi' });

    const result = queryRun(
      'INSERT INTO reminders (candidate_id, user_id, title, description, due_date) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, req.user.id, title, description || '', due_date || null]
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Eslatma qo\'shildi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete candidate
router.delete('/:id', (req, res) => {
  try {
    const candidate = queryOne('SELECT id, full_name FROM candidates WHERE id = ?', [req.params.id]);
    if (!candidate) return res.status(404).json({ error: 'Nomzod topilmadi' });

    queryRun('DELETE FROM candidates WHERE id = ?', [req.params.id]);
    res.json({ message: `${candidate.full_name} o'chirildi` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export candidates
router.get('/export/:format', (req, res) => {
  try {
    const candidates = queryAll('SELECT * FROM candidates ORDER BY created_at DESC');
    const format = req.params.format;

    if (format === 'csv') {
      const headers = [
        'ID', 'To\'liq ism', 'Telefon', 'Email', 'Ta\'lim darajasi',
        'Universitet', 'Ish tajribasi', 'Lavozim', 'Baho', 'Status', 'Sana'
      ];
      let csv = '\uFEFF' + headers.join(';') + '\n';
      candidates.forEach(c => {
        csv += [c.id, c.full_name, c.phone, c.email, c.education_level,
          c.university, c.total_experience, c.desired_position, c.score, c.status, c.created_at]
          .map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(';') + '\n';
      });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=nomzodlar.csv');
      return res.send(csv);
    }

    if (format === 'json') {
      return res.json(candidates.map(mapCandidate));
    }

    res.status(400).json({ error: 'Qo\'llab-quvvatlanadigan format: csv, json' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
