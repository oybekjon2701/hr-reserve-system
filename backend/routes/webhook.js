const express = require('express');
const { queryOne, queryRun } = require('../db');
const { calculateScore } = require('../services/scoring');
const { generateTags } = require('../services/tagging');
const { generateSummary } = require('../services/summary');
const { notifyNewCandidate, notifyDuplicate, notifyHighScore } = require('../services/notifications');

const router = express.Router();

function detectDuplicate(data) {
  if (data.telefon_raqami) {
    const dup = queryOne('SELECT id, full_name FROM candidates WHERE phone = ?', [data.telefon_raqami]);
    if (dup) return dup;
  }
  if (data.elektron_pochta) {
    const dup = queryOne('SELECT id, full_name FROM candidates WHERE email = ?', [data.elektron_pochta]);
    if (dup) return dup;
  }
  if (data['to\'liq_ism-sharif']) {
    const dup = queryOne(
      'SELECT id, full_name FROM candidates WHERE full_name = ? AND birth_date = ?',
      [data['to\'liq_ism-sharif'], data['tug\'ilgan_sana'] || '']
    );
    if (dup) return dup;
  }
  return null;
}

router.post('/google-forms', (req, res) => {
  try {
    const data = req.body;
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Ma\'lumot topilmadi' });
    }

    // Duplicate check
    const duplicate = detectDuplicate(data);
    if (duplicate) {
      notifyDuplicate(duplicate.id, duplicate.id, duplicate.full_name);
      return res.json({
        status: 'duplicate',
        message: 'Takroriy nomzod aniqlandi',
        existing_candidate_id: duplicate.id,
        existing_candidate_name: duplicate.full_name
      });
    }

    // Map Google Form fields
    const candidate = {
      full_name: data['to\'liq_ism-sharif'] || data.full_name || '',
      birth_date: data['tug\'ilgan_sana'] || data.birth_date || '',
      gender: data['jinsi'] || data.gender || '',
      phone: data['telefon_raqami'] || data.phone || '',
      email: data['elektron_pochta'] || data.email || '',
      address: data['yashash_manzili'] || data.address || '',
      education_level: data['ta\'lim_darajasi'] || data.education_level || '',
      university: data['oliy_ta\'lim_muassasi_nomi'] || data.university || '',
      specialty: data['mutaxassislik_yo\'nalishi'] || data.specialty || '',
      graduation_year: data['bitirgan_yili'] || data.graduation_year || '',
      total_experience: data['umumiy_ish_tajribasi'] || data.total_experience || '',
      last_workplace: data['oxirgi_ish_joyi'] || data.last_workplace || '',
      last_position: data['lavozimi'] || data.last_position || '',
      resignation_reason: data['ishdan_ketish_sababi'] || data.resignation_reason || '',
      computer_skill_level: data['kompyuter_dasturlari_bilan_ishlash_darajasi'] || data.computer_skill_level || '',
      known_programs: data['qaysi_dasturlarni_bilasiz'] || data.known_programs || '',
      language_skills: data['chet_tillarini_bilish_darajasi'] || data.language_skills || '',
      desired_position: data['qaysi_lavozimda_ishlamoqchisiz'] || data.desired_position || '',
      expected_salary: data['kutilayotgan_maosh'] || data.expected_salary || '',
      availability: data['qachondan_ishni_boshlashingiz_mumkin'] || data.availability || '',
      ready_full_time: data['to\'liq_stavkada_ishlashga_tayyormisiz'] || data.ready_full_time || ''
    };

    // Calculate score
    const { score, breakdown } = calculateScore(candidate);
    candidate.score = score;
    candidate.score_breakdown = JSON.stringify(breakdown);
    candidate.tags = JSON.stringify(generateTags({ ...candidate, score }));
    candidate.summary = generateSummary(candidate, { score, breakdown });
    candidate.ai_analysis = JSON.stringify({
      score, breakdown,
      generated_at: new Date().toISOString(),
      version: '1.0'
    });

    // Insert candidate
    const result = queryRun(`
      INSERT INTO candidates (
        full_name, birth_date, gender, phone, email, address,
        education_level, university, specialty, graduation_year,
        total_experience, last_workplace, last_position, resignation_reason,
        computer_skill_level, known_programs, language_skills,
        desired_position, expected_salary, availability, ready_full_time,
        status, score, score_breakdown, tags, summary, ai_analysis
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'yangi', ?, ?, ?, ?, ?)
    `, [
      candidate.full_name, candidate.birth_date, candidate.gender,
      candidate.phone, candidate.email, candidate.address,
      candidate.education_level, candidate.university, candidate.specialty,
      candidate.graduation_year, candidate.total_experience, candidate.last_workplace,
      candidate.last_position, candidate.resignation_reason, candidate.computer_skill_level,
      candidate.known_programs, candidate.language_skills, candidate.desired_position,
      candidate.expected_salary, candidate.availability, candidate.ready_full_time,
      candidate.score, candidate.score_breakdown, candidate.tags,
      candidate.summary, candidate.ai_analysis
    ]);

    const candidateId = result.lastInsertRowid;

    // Create status history
    queryRun(
      'INSERT INTO status_history (candidate_id, from_status, to_status) VALUES (?, NULL, ?)',
      [candidateId, 'yangi']
    );

    // Notifications
    notifyNewCandidate(candidateId, candidate.full_name);
    if (score >= 80) {
      notifyHighScore(candidateId, candidate.full_name, score);
    }

    res.status(201).json({
      status: 'success',
      message: 'Nomzod muvaffaqiyatli qo\'shildi',
      candidate_id: candidateId,
      score,
      duplicate_detected: false
    });

  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Server xatosi', details: err.message });
  }
});

module.exports = router;
