const express = require('express');
const bcrypt = require('bcryptjs');
const { queryAll, queryOne, queryRun } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);
router.use(requireRole('administrator'));

router.get('/', (req, res) => {
  try {
    const users = queryAll('SELECT id, username, full_name, email, role, created_at, updated_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { username, password, full_name, email, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Foydalanuvchi nomi va parol talab qilinadi' });
    }
    const existing = queryOne('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(409).json({ error: 'Bu foydalanuvchi nomi allaqachon mavjud' });
    }
    const validRoles = ['administrator', 'hr_manager'];
    const userRole = validRoles.includes(role) ? role : 'hr_manager';
    const hash = bcrypt.hashSync(password, 10);
    const result = queryRun(
      'INSERT INTO users (username, password_hash, full_name, email, role) VALUES (?, ?, ?, ?, ?)',
      [username, hash, full_name || '', email || '', userRole]
    );
    res.status(201).json({ id: result.lastInsertRowid, message: 'Foydalanuvchi yaratildi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const user = queryOne('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    const { full_name, email, role, password } = req.body;
    const updates = [];
    const params = [];

    if (full_name !== undefined) { updates.push('full_name = ?'); params.push(full_name); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (role !== undefined) {
      const validRoles = ['administrator', 'hr_manager'];
      if (validRoles.includes(role)) { updates.push('role = ?'); params.push(role); }
    }
    if (password) {
      const hash = bcrypt.hashSync(password, 10);
      updates.push('password_hash = ?'); params.push(hash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Yangilanadigan maydonlar topilmadi' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);
    queryRun(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    const updated = queryOne('SELECT id, username, full_name, email, role, created_at, updated_at FROM users WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const user = queryOne('SELECT id, username FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    if (user.username === 'admin') {
      return res.status(403).json({ error: 'Asosiy administratorni o\'chirib bo\'lmaydi' });
    }
    queryRun('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: `${user.username} foydalanuvchisi o'chirildi` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
