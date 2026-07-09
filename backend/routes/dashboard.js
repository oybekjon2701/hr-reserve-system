const express = require('express');
const { queryAll, queryOne } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/stats', (req, res) => {
  try {
    const stats = {};

    stats.total = queryOne('SELECT COUNT(*) as count FROM candidates').count;
    stats.today = queryOne("SELECT COUNT(*) as count FROM candidates WHERE date(created_at) = date('now')").count;
    stats.this_month = queryOne("SELECT COUNT(*) as count FROM candidates WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')").count;

    const statusCounts = queryAll('SELECT status, COUNT(*) as count FROM candidates GROUP BY status');
    stats.statuses = {};
    statusCounts.forEach(s => { stats.statuses[s.status] = s.count; });

    stats.avg_score = queryOne('SELECT COALESCE(AVG(score), 0) as avg FROM candidates').avg;
    stats.high_potential = queryOne('SELECT COUNT(*) as count FROM candidates WHERE score >= 80').count;
    stats.unread_notifications = queryOne('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0').count;

    // Use CASE instead of COALESCE to avoid quote escaping issues
    stats.education_distribution = queryAll(
      `SELECT CASE WHEN education_level IS NULL OR education_level = '' THEN 'Ko_rsatilmagan' ELSE education_level END as name, COUNT(*) as value
       FROM candidates GROUP BY name ORDER BY value DESC`
    );

    stats.experience_distribution = queryAll(`
      SELECT
        CASE
          WHEN CAST(COALESCE(NULLIF(total_experience, ''), '0') AS REAL) = 0 THEN 'Tajribasiz'
          WHEN CAST(COALESCE(NULLIF(total_experience, ''), '0') AS REAL) < 1 THEN '1 yildan kam'
          WHEN CAST(COALESCE(NULLIF(total_experience, ''), '0') AS REAL) < 3 THEN '1-3 yil'
          WHEN CAST(COALESCE(NULLIF(total_experience, ''), '0') AS REAL) < 5 THEN '3-5 yil'
          WHEN CAST(COALESCE(NULLIF(total_experience, ''), '0') AS REAL) < 10 THEN '5-10 yil'
          ELSE '10+ yil'
        END as name,
        COUNT(*) as value
      FROM candidates
      GROUP BY name ORDER BY value DESC
    `);

    stats.position_distribution = queryAll(
      `SELECT CASE WHEN desired_position IS NULL OR desired_position = '' THEN 'Ko_rsatilmagan' ELSE desired_position END as name, COUNT(*) as value
       FROM candidates GROUP BY name ORDER BY value DESC LIMIT 10`
    );

    stats.monthly_applications = queryAll(
      `SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as value
       FROM candidates GROUP BY month ORDER BY month ASC LIMIT 12`
    );

    stats.score_distribution = queryAll(`
      SELECT
        CASE
          WHEN score >= 80 THEN '80-100'
          WHEN score >= 60 THEN '60-79'
          WHEN score >= 40 THEN '40-59'
          WHEN score >= 20 THEN '20-39'
          ELSE '0-19'
        END as range,
        COUNT(*) as value
      FROM candidates
      GROUP BY range ORDER BY range DESC
    `);

    stats.recent_candidates = queryAll(
      'SELECT id, full_name, status, score, desired_position, created_at FROM candidates ORDER BY created_at DESC LIMIT 10'
    );

    stats.stale_candidates = queryOne(`
      SELECT COUNT(*) as count FROM candidates
      WHERE status IN ('yangi', 'ko''rib chiqilmoqda')
      AND julianday('now') - julianday(created_at) > 7
    `).count;

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/activity', (req, res) => {
  try {
    const activity = queryAll(
      `SELECT sh.*, c.full_name as candidate_name, u.full_name as user_name
       FROM status_history sh
       LEFT JOIN candidates c ON sh.candidate_id = c.id
       LEFT JOIN users u ON sh.changed_by = u.id
       ORDER BY sh.created_at DESC LIMIT 30`
    );
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
