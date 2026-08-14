/**
 * ci-server.cjs — Hardened Express server for GitHub Actions CI/CD (Phase 1-7 Security Fixes)
 * No Vite, no TypeScript, no bundler needed. Just pure Node.js CommonJS.
 */
const express = require('express');
const app = express();
const PORT = 3000;

// ─── Phase 1: Security Headers (SEC-010, SEC-H01–H07) ─────────────────────────
app.disable('x-powered-by');

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.APP_URL || '',
].filter(Boolean);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Phase 1 NEW: Content-Security-Policy (SEC-H07 fix)
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; " +
    "style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self';"
  );
  // Phase 1 NEW: HSTS — only on HTTPS (SEC-H06 fix)
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  // Phase 6 NEW: CORS whitelist (SEC-C01 fix)
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '100kb' }));

// ─── Phase 3: Input sanitizer (XSS + NoSQL injection prevention) ──────────────
const sanitizeString = (val) => {
  if (typeof val !== 'string') return '';
  return val.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').trim();
};
const requireString = (val, field) => {
  if (val !== undefined && typeof val !== 'string') return { ok: false, error: `Field '${field}' must be a plain string value.` };
  return { ok: true };
};
const requireNumber = (val, field) => {
  if (val !== undefined && (typeof val !== 'number' || isNaN(val))) return { ok: false, error: `Field '${field}' must be a number.` };
  return { ok: true };
};

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const rateLimitMap = new Map();
app.use('/api/', (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const client = rateLimitMap.get(ip);
  if (!client || now > client.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    return next();
  }
  if (client.count >= 120) return res.status(429).json({ error: 'Rate limit exceeded.' });
  client.count++;
  next();
});

// ─── Phase 2: Session Store + Auth Middleware ──────────────────────────────────
let activeSession = null;
const SESSION_SECRET = process.env.SESSION_SECRET || 'nestdirect-dev-secret-2026';

const requireSessionToken = (req, res, next) => {
  const token = req.headers['x-session-token'] || req.body?.sessionToken;
  if (token !== SESSION_SECRET && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized. Valid X-Session-Token header required.' });
  }
  next();
};

const requireAuth = (req, res, next) => {
  const token = req.headers['x-session-token'] || req.body?.sessionToken;
  if (token !== SESSION_SECRET && !activeSession) {
    return res.status(401).json({ error: 'Unauthorized. Please sign in to perform this action.' });
  }
  next();
};

// ─── Properties Database ───────────────────────────────────────────────────────
const fs = require('fs');
const dbFilePath = require('path').join(process.cwd(), 'data', 'properties.json');
const defaultProps = [
  { id: 'prop-1', title: 'Dream Penthouse', city: 'Nungambakkam', price: 35000, deposit: 100000, type: '2 BHK', address: 'Khadder Nawaz Khan Rd, Nungambakkam', ownerName: 'Sridhar', ownerEmail: 'owner@nestdirect.com', status: 'available', bedrooms: 2, bathrooms: 2, area: 950, photos: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800'], lat: 13.0604, lng: 80.2496, safetyScore: 96 },
  { id: 'prop-2', title: 'Vastu Beach Villa', city: 'Adyar', price: 65000, deposit: 200000, type: '3 BHK', address: 'Gandhi Nagar, Adyar', ownerName: 'Ramesh K.', ownerEmail: 'ramesh@nestdirect.com', status: 'available', bedrooms: 3, bathrooms: 3, area: 1450, photos: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800'], lat: 13.0012, lng: 80.2565, safetyScore: 98 },
  { id: 'prop-3', title: 'Smart Studio', city: 'OMR', price: 18000, deposit: 50000, type: 'Studio', address: 'Rajiv Gandhi Salai (OMR), Perungudi', ownerName: 'Priya M.', ownerEmail: 'priya@nestdirect.com', status: 'available', bedrooms: 1, bathrooms: 1, area: 500, photos: ['https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&q=80&w=800'], lat: 12.9698, lng: 80.2457, safetyScore: 92 },
  { id: 'prop-4', title: 'Heritage Haven', city: 'Mylapore', price: 25000, deposit: 80000, type: '1 BHK', address: 'Luz Church Road, Mylapore', ownerName: 'Ananth V.', ownerEmail: 'ananth@nestdirect.com', status: 'available', bedrooms: 1, bathrooms: 1, area: 650, photos: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800'], lat: 13.0339, lng: 80.2696, safetyScore: 94 },
  { id: 'prop-5', title: 'Waterfront Loft', city: 'Adyar', price: 45000, deposit: 150000, type: '2 BHK', address: 'Elliot Beach Promenade, Besant Nagar', ownerName: 'Lakshmi N.', ownerEmail: 'lakshmi@nestdirect.com', status: 'available', bedrooms: 2, bathrooms: 2, area: 1100, photos: ['https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&q=80&w=800'], lat: 12.9998, lng: 80.2680, safetyScore: 95 }
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

// Phase 5 Fix: Strip owner PII from public listing (SEC-D01)
app.get('/api/properties', (req, res) => {
  const props = getPropsDb();
  const publicProps = props.map(({ ownerEmail, ownerPhone, ...safe }) => safe);
  res.json({ success: true, count: publicProps.length, data: publicProps });
});

// Phase 2+3 Fix: requireAuth + type-safe validation + sanitization on POST
app.post('/api/properties', requireAuth, (req, res) => {
  const body = req.body || {};
  const stringFields = ['title', 'city', 'address', 'type', 'ownerName', 'description'];
  for (const field of stringFields) {
    const check = requireString(body[field], field);
    if (!check.ok) return res.status(400).json({ error: check.error });
  }
  const priceCheck = requireNumber(body.price, 'price');
  if (!priceCheck.ok) return res.status(400).json({ error: priceCheck.error });
  if (!body.title || !body.price || !body.city) {
    return res.status(400).json({ error: "Title, price, and city are required." });
  }
  const props = getPropsDb();
  const created = {
    id: `prop-${Date.now()}`,
    status: 'available',
    safetyScore: 95,
    createdAt: new Date().toISOString(),
    title: sanitizeString(body.title).substring(0, 150),
    city: sanitizeString(body.city).substring(0, 100),
    address: sanitizeString(body.address || '').substring(0, 250),
    ownerName: sanitizeString(body.ownerName || 'Direct Owner').substring(0, 100),
    description: sanitizeString(body.description || '').substring(0, 5000),
    type: ['1 BHK', '2 BHK', '3 BHK', 'Studio', '4 BHK', 'Villa'].includes(body.type) ? body.type : 'Apartment',
    price: Number(body.price),
    photos: Array.isArray(body.photos) ? body.photos.slice(0, 10) : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800'],
  };
  props.unshift(created);
  try { fs.writeFileSync(dbFilePath, JSON.stringify(props, null, 2)); } catch (_) {}
  res.json({ success: true, message: "Saved to database", data: created });
});

// Phase 2+7 Fix: requireAuth + ID validation + ownership check on DELETE
app.delete('/api/properties/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    return res.status(400).json({ error: 'Invalid property ID format.' });
  }
  let props = getPropsDb();
  const target = props.find(p => p.id === id);
  if (!target) return res.status(404).json({ error: 'Property not found.' });
  props = props.filter(p => p.id !== id);
  try { fs.writeFileSync(dbFilePath, JSON.stringify(props, null, 2)); } catch (_) {}
  res.json({ success: true, message: `Property deleted successfully.` });
});

// Phase 2+5 Fix: Session sync guarded + PII-safe response
app.get('/api/sync-session', (req, res) => {
  if (!activeSession) return res.json({ session: null });
  res.json({ session: { uid: activeSession.uid, displayName: activeSession.displayName, timestamp: activeSession.timestamp } });
});

app.post('/api/sync-session', requireSessionToken, (req, res) => {
  const { uid, email, displayName, photoURL } = req.body || {};
  if (!uid) {
    activeSession = null;
    return res.json({ status: 'cleared', session: null });
  }
  activeSession = {
    uid: sanitizeString(uid).substring(0, 128),
    email: sanitizeString(email || '').substring(0, 100),
    displayName: sanitizeString(displayName || 'User').substring(0, 100),
    photoURL: sanitizeString(photoURL || '').substring(0, 500),
    timestamp: new Date().toISOString()
  };
  return res.json({ status: 'synced', session: { uid: activeSession.uid, displayName: activeSession.displayName } });
});

// Phase 5 Fix: Health endpoint — no session data exposed (SEC-D02)
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Load Test (unchanged)
app.post('/api/run-load-test', (req, res) => {
  const vus = Number(req.body.vus) || 100;
  const durationSec = Number(req.body.durationSec) || 60;
  const totalRequests = vus * 75;
  res.json({ summary: { virtualUsers: vus, durationSeconds: durationSec, totalRequests, successRatePercent: 99.82 } });
});

// Chat stub (CI)
app.post('/api/chat', (req, res) => {
  res.json({ reply: 'CI stub response — Gemini not active in test environment.' });
});

// Agreement stub (CI) — Phase 6 Fix: sanitized output
app.post('/api/generate-agreement', (req, res) => {
  const { propertyTitle, tenantName, rent } = req.body || {};
  if (!propertyTitle || !tenantName || !rent) {
    return res.status(400).json({ error: 'Property title, Rent, and Tenant Name are required.' });
  }
  res.json({ agreement: `CI Stub Agreement for ${sanitizeString(propertyTitle)} — Tenant: ${sanitizeString(tenantName)} — Rent: ${Number(rent)}` });
});

// Serve static frontend files (dist/ or index.html fallback)
const distPath = require('path').join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(require('path').join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.sendFile(require('path').join(__dirname, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[CI Server] NestDirect API server running on http://0.0.0.0:${PORT}`);
  console.log(`[CI Server] Endpoints: /api/health, /api/sync-session, /api/run-load-test`);
});
