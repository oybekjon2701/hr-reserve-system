const { queryRun, queryAll, queryOne } = require('../db');

function createNotification(candidateId, type, title, message) {
  queryRun(
    'INSERT INTO notifications (candidate_id, type, title, message) VALUES (?, ?, ?, ?)',
    [candidateId, type, title, message]
  );
}

function notifyNewCandidate(candidateId, fullName) {
  createNotification(candidateId, 'new_candidate', 'Yangi nomzod', `${fullName} tizimga qo'shildi. Profilni ko'rib chiqing.`);
}

function notifyDuplicate(candidateId, existingId, fullName) {
  createNotification(candidateId, 'duplicate', 'Takroriy nomzod', `${fullName} uchun takroriy ariza aniqlandi (ID: ${existingId}). Iltimos tekshiring.`);
}

function notifyHighScore(candidateId, fullName, score) {
  createNotification(candidateId, 'high_score', 'Yuqori ball', `${fullName} ${score} ball bilan yuqori baholandi. Profilni ko'rib chiqing.`);
}

function notifyStaleCandidates() {
  const stale = queryAll(
    `SELECT id, full_name, status, created_at
     FROM candidates
     WHERE status IN ('yangi', 'ko''rib chiqilmoqda')
     AND julianday('now') - julianday(created_at) > 7`
  );
  stale.forEach(c => {
    createNotification(c.id, 'stale', 'Kutilayotgan nomzod', `${c.full_name} ${c.status === 'yangi' ? 'yangi' : 'ko\'rib chiqilmoqda'} holatida 7 kundan ortiq kutilmoqda.`);
  });
  return stale.length;
}

function checkAndNotifyHighScores() {
  const highScorers = queryAll(
    `SELECT id, full_name, score
     FROM candidates
     WHERE score >= 80
     AND id NOT IN (SELECT candidate_id FROM notifications WHERE type = 'high_score')`
  );
  highScorers.forEach(c => notifyHighScore(c.id, c.full_name, c.score));
  return highScorers.length;
}

function getUnreadCount() {
  return queryOne('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0').count;
}

function getAllNotifications(limit = 50) {
  return queryAll(
    `SELECT n.*, c.full_name as candidate_name
     FROM notifications n
     LEFT JOIN candidates c ON n.candidate_id = c.id
     ORDER BY n.created_at DESC LIMIT ?`, [limit]
  );
}

function markAsRead(id) {
  queryRun('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
}

function markAllAsRead() {
  queryRun('UPDATE notifications SET is_read = 1 WHERE is_read = 0');
}

module.exports = {
  notifyNewCandidate, notifyDuplicate, notifyHighScore,
  notifyStaleCandidates, checkAndNotifyHighScores,
  getUnreadCount, getAllNotifications, markAsRead, markAllAsRead
};
