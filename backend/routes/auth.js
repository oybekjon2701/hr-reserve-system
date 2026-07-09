const express = require('express');
const bcrypt = require('bcryptjs');
const { queryOne, queryRun } = require('../db');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Foydalanuvchi nomi va parol talab qilinadi' });
    }
    const user = queryOne('SELECT * FROM users WHERE username = ?', [username]);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Foydalanuvchi nomi yoki parol noto\'g\'ri' });
    }
    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authenticate, (req, res) => {
  try {
    const user = queryOne('SELECT id, username, full_name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/password', authenticate, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Joriy va yangi parol talab qilinadi' });
    }
    const user = queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: 'Joriy parol noto\'g\'ri' });
    }
    const hash = bcrypt.hashSync(newPassword, 10);
    queryRun('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hash, req.user.id]);
    res.json({ message: 'Parol muvaffaqiyatli yangilandi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
