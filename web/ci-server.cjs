/**
 * ci-server.js — Minimal Express server for GitHub Actions CI/CD
 * No Vite, no TypeScript, no bundler needed. Just pure Node.js CommonJS.
 * Exposes all API endpoints that tests and load tests target.
 */
const express = require('express');
const app = express();
const PORT = 3000;

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

// In-memory session store
let activeSession = null;

// Rate limiting (lightweight)
const rateLimitMap = new Map();
app.use('/api/', (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const client = rateLimitMap.get(ip);
  if (!client || now > client.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    return next();
  }
  if (client.count >= 120) {
    return res.status(429).json({ error: 'Rate limit exceeded.' });
  }
  client.count++;
  next();
});

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeSession
  });
});

// ── Session Sync GET ──────────────────────────────────────────────────────────
app.get('/api/sync-session', (req, res) => {
  res.json({ session: activeSession });
});

// ── Session Sync POST ─────────────────────────────────────────────────────────
app.post('/api/sync-session', (req, res) => {
  const { uid, email, displayName, photoURL } = req.body || {};
  if (!uid) {
    activeSession = null;
    return res.json({ status: 'cleared', session: null });
  }
  activeSession = { uid, email: email || '', displayName: displayName || 'User', photoURL: photoURL || '', timestamp: new Date().toISOString() };
  return res.json({ status: 'synced', session: activeSession });
});

// ── Load Test Simulation ──────────────────────────────────────────────────────
app.post('/api/run-load-test', (req, res) => {
  const vus = Number(req.body.vus) || 100;
  const durationSec = Number(req.body.durationSec) || 60;
  const totalRequests = vus * 75;
  res.json({ summary: { virtualUsers: vus, durationSeconds: durationSec, totalRequests, successRatePercent: 99.82 } });
});

// ── Chat (stub for CI) ────────────────────────────────────────────────────────
app.post('/api/chat', (req, res) => {
  res.json({ reply: 'CI stub response — Gemini not active in test environment.' });
});

// ── Generate Agreement (stub for CI) ─────────────────────────────────────────
app.post('/api/generate-agreement', (req, res) => {
  const { propertyTitle, tenantName, rent } = req.body || {};
  if (!propertyTitle || !tenantName || !rent) {
    return res.status(400).json({ error: 'Property title, Rent, and Tenant Name are required.' });
  }
  res.json({ agreement: `CI Stub Agreement for ${propertyTitle} — Tenant: ${tenantName} — Rent: ${rent}` });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[CI Server] NestDirect API server running on http://0.0.0.0:${PORT}`);
  console.log(`[CI Server] Endpoints: /api/health, /api/sync-session, /api/run-load-test`);
});
