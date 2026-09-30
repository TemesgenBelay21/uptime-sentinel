require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const siteRoutes = require('./routes/sites');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ─── Global rate limit ────────────────────────────────────────────────────────
const globalLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimit);

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/sites', siteRoutes);

// Public status — also accessible under /api/status/:slug
app.get('/api/status/:publicSlug', require('./controllers/siteController').getPublicStatus);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404
app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
