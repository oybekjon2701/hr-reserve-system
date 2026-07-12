const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { initDb } = require('./db');

const authRoutes = require('./routes/auth');
const candidateRoutes = require('./routes/candidates');
const webhookRoutes = require('./routes/webhook');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const userRoutes = require('./routes/users');
const { checkAndNotifyHighScores, notifyStaleCandidates } = require('./services/notifications');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: "API yo'nalishi topilmadi" });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Periodic tasks (every 30 minutes)
setInterval(() => {
  try {
    checkAndNotifyHighScores();
    notifyStaleCandidates();
  } catch (e) {
    console.error('Periodic task error:', e.message);
  }
}, 30 * 60 * 1000);

// Initialize database and start server
const server = http.createServer(app);

initDb().then(() => {
  server.listen(PORT, () => {
    console.log(`HR Reserve System ishlayapti: http://localhost:${PORT}`);
    console.log(`Google Forms webhook: POST http://localhost:${PORT}/api/webhook/google-forms`);
    console.log(`Dashboard: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});

module.exports = { app, server };
