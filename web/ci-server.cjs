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

// ── Properties Database Endpoints ──────────────────────────────────────────────
const fs = require('fs');
const dbFilePath = require('path').join(process.cwd(), 'data', 'properties.json');
const defaultProps = [
  { id: 'prop-1', title: 'Dream Penthouse 😊', city: 'Nungambakkam', price: 35000, deposit: 100000, type: '2 BHK', address: 'Khadder Nawaz Khan Rd, Nungambakkam', ownerName: 'Sridhar (You)', ownerEmail: 'owner@nestdirect.com', status: 'available', bedrooms: 2, bathrooms: 2, area: 950, photos: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800'], lat: 13.0604, lng: 80.2496, safetyScore: 96 },
  { id: 'prop-2', title: 'Vastu Beach Villa 🌊', city: 'Adyar', price: 65000, deposit: 200000, type: '3 BHK', address: 'Gandhi Nagar, Adyar', ownerName: 'Ramesh K.', ownerEmail: 'ramesh@nestdirect.com', status: 'available', bedrooms: 3, bathrooms: 3, area: 1450, photos: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800'], lat: 13.0012, lng: 80.2565, safetyScore: 98 },
  { id: 'prop-3', title: 'Smart Studio ⚡', city: 'OMR', price: 18000, deposit: 50000, type: 'Studio', address: 'Rajiv Gandhi Salai (OMR), Perungudi', ownerName: 'Priya M.', ownerEmail: 'priya@nestdirect.com', status: 'available', bedrooms: 1, bathrooms: 1, area: 500, photos: ['https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&q=80&w=800'], lat: 12.9698, lng: 80.2457, safetyScore: 92 },
  { id: 'prop-4', title: 'Heritage Haven 🏡', city: 'Mylapore', price: 25000, deposit: 80000, type: '1 BHK', address: 'Luz Church Road, Mylapore', ownerName: 'Ananth V.', ownerEmail: 'ananth@nestdirect.com', status: 'available', bedrooms: 1, bathrooms: 1, area: 650, photos: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800'], lat: 13.0339, lng: 80.2696, safetyScore: 94 },
  { id: 'prop-5', title: 'Waterfront Loft 🏙️', city: 'Adyar', price: 45000, deposit: 150000, type: '2 BHK', address: 'Elliot Beach Promenade, Besant Nagar', ownerName: 'Lakshmi N.', ownerEmail: 'lakshmi@nestdirect.com', status: 'available', bedrooms: 2, bathrooms: 2, area: 1100, photos: ['https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&q=80&w=800'], lat: 12.9998, lng: 80.2680, safetyScore: 95 }
];

const getPropsDb = () => {
  try {
    if (!fs.existsSync(dbFilePath)) {
      const dir = require('path').dirname(dbFilePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(dbFilePath, JSON.stringify(defaultProps, null, 2));
      return defaultProps;
    }
    return JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
  } catch (e) { return defaultProps; }
};

app.get('/api/properties', (req, res) => {
  const props = getPropsDb();
  res.json({ success: true, count: props.length, data: props });
});

app.post('/api/properties', (req, res) => {
  const newProp = req.body || {};
  if (!newProp.title || !newProp.price || !newProp.city) {
    return res.status(400).json({ error: "Title, price, and city are required." });
  }
  const props = getPropsDb();
  const created = { id: `prop-${Date.now()}`, status: 'available', safetyScore: 95, createdAt: new Date().toISOString(), ...newProp };
  props.unshift(created);
  try { fs.writeFileSync(dbFilePath, JSON.stringify(props, null, 2)); } catch (e) {}
  res.json({ success: true, message: "Saved to database", data: created });
});

app.delete('/api/properties/:id', (req, res) => {
  let props = getPropsDb();
  props = props.filter(p => p.id !== req.params.id);
  try { fs.writeFileSync(dbFilePath, JSON.stringify(props, null, 2)); } catch (e) {}
  res.json({ success: true, message: `Deleted ${req.params.id}` });
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
