require('dotenv').config();
const express = require('express');

const app = express();

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));

module.exports = app;
