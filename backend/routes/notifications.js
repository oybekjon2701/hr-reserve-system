const express = require('express');
const { queryAll, queryOne, queryRun } = require('../db');
const { authenticate } = require('../middleware/auth');
const { getAllNotifications, getUnreadCount, markAsRead, markAllAsRead } = require('../services/notifications');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const notifications = getAllNotifications(limit);
    const unread = getUnreadCount();
    res.json({ notifications, unread_count: unread });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/unread-count', (req, res) => {
  try {
    const count = getUnreadCount();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/read', (req, res) => {
  try {
    markAsRead(req.params.id);
    res.json({ message: "Bildirishnoma o'qilgan deb belgilandi" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/read-all', (req, res) => {
  try {
    markAllAsRead();
    res.json({ message: "Barcha bildirishnomalar o'qilgan deb belgilandi" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
