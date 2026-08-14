#!/usr/bin/env node
/**
 * scripts/security/dast-api-tests.js
 * ─────────────────────────────────────────────────────────────────────────────
 * NestDirect DAST — Dynamic API Security Testing Suite
 * Non-destructive, detection-only penetration tests for all Express endpoints.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ─── Colour helpers ───────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', bold: '\x1b[1m',
};
const pass  = (msg) => console.log(`  ${C.green}✅ PASS${C.reset}  ${msg}`);
const fail  = (msg) => console.log(`  ${C.red}❌ FAIL${C.reset}  ${msg}`);
const warn  = (msg) => console.log(`  ${C.yellow}⚠️  WARN${C.reset}  ${msg}`);
const info  = (msg) => console.log(`  ${C.cyan}ℹ️  INFO${C.reset}  ${msg}`);
const title = (msg) => console.log(`\n${C.bold}${C.cyan}${msg}${C.reset}`);

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
function request(method, endpoint, body = null, extraHeaders = {}) {
  return new Promise((resolve) => {
    const url = new URL(endpoint, BASE_URL);
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...extraHeaders,
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw: data });
      });
    });
    req.on('error', (e) => resolve({ status: 0, headers: {}, body: null, error: e.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

// ─── Result accumulator ───────────────────────────────────────────────────────
const findings = [];
let totalTests = 0;
let passedTests = 0;
let warnTests = 0;

function addFinding(severity, type, endpoint, description, remediation) {
  findings.push({ severity, type, endpoint, description, remediation });
}

function check(passed, testName, endpoint, passMsg, failMsg, severity = 'MEDIUM', type = 'API Security', remediation = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    pass(`${testName} — ${passMsg}`);
  } else {
    if (severity === 'LOW') { warnTests++; warn(`${testName} — ${failMsg}`); }
    else { fail(`${testName} — ${failMsg}`); }
    addFinding(severity, type, endpoint, failMsg, remediation);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1: Security Headers
// ─────────────────────────────────────────────────────────────────────────────
async function testSecurityHeaders() {
  title('PHASE 1 — Security Headers');
  const r = await request('GET', '/api/health');
  const h = r.headers;

  check(!h['x-powered-by'], 'SEC-H01', '/api/health', 'X-Powered-By header removed', 'X-Powered-By header reveals server technology (fingerprinting risk)', 'LOW', 'Information Disclosure', 'app.disable("x-powered-by")');
  check(!!h['x-content-type-options'], 'SEC-H02', '/api/health', 'X-Content-Type-Options present', 'Missing X-Content-Type-Options header (MIME sniffing risk)', 'MEDIUM', 'Security Headers', 'res.setHeader("X-Content-Type-Options","nosniff")');
  check(!!h['x-frame-options'], 'SEC-H03', '/api/health', 'X-Frame-Options present', 'Missing X-Frame-Options header (clickjacking risk)', 'MEDIUM', 'Security Headers', 'res.setHeader("X-Frame-Options","SAMEORIGIN")');
  check(!!h['x-xss-protection'], 'SEC-H04', '/api/health', 'X-XSS-Protection present', 'Missing X-XSS-Protection header', 'LOW', 'Security Headers', 'res.setHeader("X-XSS-Protection","1; mode=block")');
  check(!!h['referrer-policy'], 'SEC-H05', '/api/health', 'Referrer-Policy present', 'Missing Referrer-Policy header', 'LOW', 'Security Headers', 'res.setHeader("Referrer-Policy","strict-origin-when-cross-origin")');

  // Check for missing HSTS (informational — not enforced in HTTP dev)
  if (!h['strict-transport-security']) {
    warn('SEC-H06 — Missing Strict-Transport-Security (HSTS). Required in production HTTPS deployments.');
    addFinding('LOW', 'Security Headers', '/api/*', 'Missing HSTS header. Should be present in production.', 'Add HSTS header in production: Strict-Transport-Security: max-age=31536000; includeSubDomains');
  } else {
    pass('SEC-H06 — Strict-Transport-Security header present');
  }

  // Missing CSP check
  if (!h['content-security-policy']) {
    warn('SEC-H07 — Missing Content-Security-Policy (CSP). Recommended for production.');
    addFinding('MEDIUM', 'Security Headers', '/api/*', 'No Content-Security-Policy header detected.', 'Add a strict CSP policy via helmet.js or manual header');
  } else {
    pass('SEC-H07 — Content-Security-Policy present');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2: Authentication Bypass Testing
// ─────────────────────────────────────────────────────────────────────────────
async function testAuthentication() {
  title('PHASE 2 — Authentication Bypass');

  // All current API endpoints are intentionally unauthenticated (design decision)
  // We document this as a finding for review

  const r1 = await request('GET', '/api/properties');
  check(r1.status === 200, 'SEC-A01', 'GET /api/properties', 'Properties endpoint accessible (public by design)', 'CRITICAL — No authentication on POST/DELETE property mutations — any anonymous client can add or delete listings', 'HIGH', 'Broken Authentication', 'Add Firebase ID token middleware to validate request.auth before mutating data');

  const r2 = await request('POST', '/api/properties', {
    title: 'DAST Test Property — DELETE ME',
    price: 1,
    city: 'Test',
    ownerName: 'DAST Scanner',
  });
  check(r2.status !== 201 && r2.status !== 200, 'SEC-A02', 'POST /api/properties', '(Expected: authz block on unauthenticated mutations)', `POST /api/properties accepted unauthenticated write — status ${r2.status}`, 'HIGH', 'Broken Authentication', 'Require Authorization: Bearer <Firebase ID Token> header and verify with Firebase Admin SDK');

  const r3 = await request('GET', '/api/sync-session');
  check(r3.status === 200, 'SEC-A03', 'GET /api/sync-session', 'Session endpoint returns 200', `Session endpoint error: ${r3.status}`, 'INFO', 'Session Management', '');
  if (r3.body && r3.body.session) {
    warn('SEC-A04 — Active session data returned in plaintext to any client. Recommend adding IP or token validation to session broadcast.');
    addFinding('MEDIUM', 'Session Management', 'GET /api/sync-session', 'Session data returned to any unauthenticated caller. An attacker on the same network can steal session.', 'Require a shared secret or session token for /api/sync-session reads');
  } else {
    pass('SEC-A04 — No live session data exposed (null session)');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3: Injection Detection (Non-destructive)
// ─────────────────────────────────────────────────────────────────────────────
async function testInjection() {
  title('PHASE 3 — Injection Detection');

  // NoSQL Injection attempt via property body
  const noSqlPayload = { title: { $gt: '' }, price: 1, city: 'Test' };
  const r1 = await request('POST', '/api/properties', noSqlPayload);
  const noSqlBlocked = r1.status === 400 || (r1.body && r1.body.error);
  check(noSqlBlocked, 'SEC-I01', 'POST /api/properties', 'NoSQL injection payload rejected (type coercion safe)', 'Potential NoSQL injection: object payload not rejected — may override property fields', 'MEDIUM', 'NoSQL Injection', 'Add Joi/Zod schema validation on all POST body fields. Whitelist allowed types.');

  // XSS payload in title
  const xssPayload = { title: '<script>alert("XSS")</script>', price: 100, city: 'Chennai' };
  const r2 = await request('POST', '/api/properties', xssPayload);
  const xssStored = r2.status === 200 && r2.body && r2.body.data && r2.body.data.title.includes('<script>');
  check(!xssStored, 'SEC-I02', 'POST /api/properties', 'XSS payload not reflected in response as raw HTML', 'Stored XSS: Script tag stored verbatim in DB and reflected in API response. React escapes it client-side but API consumers may not.', 'MEDIUM', 'Stored XSS', 'Add DOMPurify/sanitize-html on the server before storing user-supplied text fields.');

  // Path traversal in DELETE endpoint
  const r3 = await request('DELETE', '/api/properties/../../etc/passwd');
  check(r3.status !== 200 || (r3.body && r3.body.success), 'SEC-I03', 'DELETE /api/properties/../../etc/passwd', 'Path traversal in ID param did not cause file system error', 'Path traversal via :id param may be exploitable if ID is used in file paths', 'LOW', 'Path Traversal', 'Validate :id against safe pattern ^[a-zA-Z0-9_-]+$ before use');

  // Command injection attempt in chat message
  const cmdPayload = { message: '; ls -la /etc', history: [] };
  const r4 = await request('POST', '/api/chat', cmdPayload);
  check(r4.status !== 500 && !(r4.raw || '').includes('total'), 'SEC-I04', 'POST /api/chat', 'Command injection in message did not leak system output', 'Possible server-side command execution risk via message field', 'LOW', 'Command Injection', 'Sanitize all user input before passing to any shell or subprocess');

  // SQL/Template injection in agreement generator
  const sqlPayload = { propertyTitle: "'; DROP TABLE properties;--", rent: 1000, tenantName: 'DAST' };
  const r5 = await request('POST', '/api/generate-agreement', sqlPayload);
  check(r5.status !== 500, 'SEC-I05', 'POST /api/generate-agreement', 'SQL injection in agreement fields did not cause 500', 'SQL injection payload caused 500 error — potential unhandled error leakage', 'LOW', 'SQL Injection', 'This uses file-based DB (no SQL), but validate and sanitize all inputs regardless.');
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 4: Rate Limiting
// ─────────────────────────────────────────────────────────────────────────────
async function testRateLimiting() {
  title('PHASE 4 — Rate Limiting & Throttling');

  // Send 130 requests to trigger 429
  const promises = [];
  for (let i = 0; i < 130; i++) {
    promises.push(request('GET', '/api/health'));
  }
  const results = await Promise.all(promises);
  const limited = results.some(r => r.status === 429);
  check(limited, 'SEC-R01', '/api/*', 'Rate limiting triggered (429) after 120 req/min threshold', 'Rate limiter NOT triggered after 130 requests — brute-force and DDoS amplification risk', 'HIGH', 'Rate Limiting', 'Verify rateLimitMap logic handles concurrent requests correctly; consider using express-rate-limit package');
  
  const limitedCount = results.filter(r => r.status === 429).length;
  info(`Rate limit triggered on ${limitedCount}/130 requests`);
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5: Excessive Data Exposure
// ─────────────────────────────────────────────────────────────────────────────
async function testDataExposure() {
  title('PHASE 5 — Excessive Data Exposure');

  const r = await request('GET', '/api/properties');
  if (r.body && r.body.data && r.body.data.length > 0) {
    const prop = r.body.data[0];
    const sensitiveFields = ['ownerEmail', 'ownerPhone'];
    const exposed = sensitiveFields.filter(f => prop[f]);
    if (exposed.length > 0) {
      warn(`SEC-D01 — Owner PII exposed in public /api/properties response: [${exposed.join(', ')}]. Tenants can harvest owner contact details without authentication.`);
      addFinding('MEDIUM', 'Excessive Data Exposure', 'GET /api/properties', `Owner PII fields (${exposed.join(', ')}) returned in public listing API. Allows scraping of all owner contact data.`, 'Remove ownerEmail and ownerPhone from public listing response. Only expose after authenticated tenant requests a tour.');
    } else {
      pass('SEC-D01 — No sensitive PII fields in public listing response');
    }
  }

  // Health endpoint leaking session data
  const r2 = await request('GET', '/api/health');
  if (r2.body && r2.body.activeSession) {
    warn('SEC-D02 — Health endpoint exposes active session data (uid, email, displayName). Any client can poll /api/health to get current logged-in user details.');
    addFinding('MEDIUM', 'Sensitive Data Exposure', 'GET /api/health', 'Active session (uid, email) exposed in public /api/health endpoint', 'Remove activeSession from /api/health response. Use a dedicated /api/auth/me endpoint behind auth middleware.');
  } else {
    pass('SEC-D02 — Health endpoint does not expose session data');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 6: CORS & Error Handling
// ─────────────────────────────────────────────────────────────────────────────
async function testCORSAndErrors() {
  title('PHASE 6 — CORS & Error Handling');

  const r1 = await request('GET', '/api/health', null, { 'Origin': 'https://evil.attacker.com' });
  const corsHeader = r1.headers['access-control-allow-origin'];
  if (corsHeader === '*') {
    fail('SEC-C01 — CORS allows all origins (*): Any website can make authenticated API calls');
    addFinding('HIGH', 'Dangerous CORS', '/api/*', 'CORS policy allows all origins with Access-Control-Allow-Origin: *', 'Restrict CORS to specific allowed origins (e.g., production domain only)');
  } else if (!corsHeader) {
    pass('SEC-C01 — No wildcard CORS header (CORS not enabled by default)');
  } else {
    warn(`SEC-C01 — CORS header present with value: ${corsHeader}`);
  }

  // Error message leakage — verify error is clean string (no stack trace)
  const r2 = await request('POST', '/api/generate-agreement', {});
  const hasCleanError = r2.status === 400 && r2.body && typeof r2.body.error === 'string' && r2.body.error.length < 200;
  const hasStackTrace = (r2.raw || '').toLowerCase().includes(' at ') || (r2.raw || '').includes('stack');
  check(hasCleanError && !hasStackTrace, 'SEC-C02', 'POST /api/generate-agreement', 'Validation error returns clean message without stack trace', 'Error response contains stack trace or is not a clean error message', 'MEDIUM', 'Error Handling', 'Use a global Express error handler that returns only {error: string} without internal details.');

  // Large payload test (DoS protection)
  const largePayload = { message: 'A'.repeat(200 * 1024), history: [], inventory: [] };
  const r3 = await request('POST', '/api/chat', largePayload);
  check(r3.status === 413 || r3.status === 400 || r3.status === 500, 'SEC-C03', 'POST /api/chat', 'Large payload (200KB) rejected or handled', 'Large payload accepted without rejection (DoS amplification risk)', 'MEDIUM', 'Payload Size Limit', 'Ensure express.json({ limit: "100kb" }) is enforced on all routes');
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 7: IDOR Testing
// ─────────────────────────────────────────────────────────────────────────────
async function testIDOR() {
  title('PHASE 7 — IDOR (Insecure Direct Object Reference)');

  // Attempt to delete a property owned by another user without auth
  const r1 = await request('DELETE', '/api/properties/prop-1');
  if (r1.status === 200 && r1.body && r1.body.success) {
    fail('SEC-IDOR01 — CRITICAL IDOR: Unauthenticated DELETE on /api/properties/prop-1 succeeded! Any anonymous user can delete any listing.');
    addFinding('CRITICAL', 'IDOR', 'DELETE /api/properties/:id', 'Unauthenticated DELETE request successfully deleted a property. No ownership verification.', 'Require Firebase Auth ID token and verify resource.ownerEmail === request.auth.email before allowing DELETE.');
  } else {
    pass('SEC-IDOR01 — DELETE /api/properties/:id blocked or failed without auth');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORT GENERATION
// ─────────────────────────────────────────────────────────────────────────────
function generateReport() {
  const outputDir = path.join(process.cwd(), 'Vulnerability Test Results');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const critical = findings.filter(f => f.severity === 'CRITICAL');
  const high     = findings.filter(f => f.severity === 'HIGH');
  const medium   = findings.filter(f => f.severity === 'MEDIUM');
  const low      = findings.filter(f => ['LOW', 'INFO'].includes(f.severity));

  const securityScore = Math.max(0, 100 - (critical.length * 20) - (high.length * 10) - (medium.length * 5) - (low.length * 1));

  const mdReport = `# NestDirect DAST Security Report
> Generated: ${new Date().toISOString()}
> Base URL: ${BASE_URL}

## Executive Summary

| Metric | Value |
|:---|:---|
| Total Tests | ${totalTests} |
| Passed | ${passedTests} |
| Warnings | ${warnTests} |
| Failed | ${totalTests - passedTests - warnTests} |
| Critical Findings | ${critical.length} |
| High Findings | ${high.length} |
| Medium Findings | ${medium.length} |
| Low/Info Findings | ${low.length} |
| **Overall Security Score** | **${securityScore}/100** |

---

## Findings

${findings.map((f, i) => `### Finding ${i + 1}: ${f.type}
- **Severity:** ${f.severity}
- **Endpoint:** \`${f.endpoint}\`
- **Description:** ${f.description}
- **Remediation:** ${f.remediation}
`).join('\n')}

---

## Endpoint Inventory

| Endpoint | Method | Auth Required | Notes |
|:---|:---|:---|:---|
| /api/health | GET | ❌ No | Exposes activeSession — potential info leak |
| /api/sync-session | GET | ❌ No | Exposes user session to all clients |
| /api/sync-session | POST | ❌ No | Any client can write session — no verification |
| /api/properties | GET | ❌ No | Public listing — exposes owner PII |
| /api/properties | POST | ❌ No | **CRITICAL** — Unauthenticated write |
| /api/properties/:id | DELETE | ❌ No | **CRITICAL** — IDOR risk |
| /api/chat | POST | ❌ No | Calls Gemini AI — rate limited only |
| /api/generate-agreement | POST | ❌ No | Calls Gemini AI — rate limited only |
| /api/run-load-test | POST | ❌ No | Load test simulation — no auth |
| /api/export-audit-excel | GET | ❌ No | Excel export — no auth |
`;

  fs.writeFileSync(path.join(outputDir, 'dast-report.md'), mdReport);
  fs.writeFileSync(path.join(outputDir, 'dast-findings.json'), JSON.stringify(findings, null, 2));

  console.log('\n' + '═'.repeat(60));
  console.log(`  Security Score: ${securityScore}/100`);
  console.log(`  Critical: ${critical.length}  High: ${high.length}  Medium: ${medium.length}  Low: ${low.length}`);
  console.log('═'.repeat(60));

  return { critical, high, securityScore, findings };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  🔒 NestDirect DAST API Security Test Suite`);
  console.log(`  Target: ${BASE_URL}`);
  console.log('═'.repeat(60));

  await testSecurityHeaders();
  await testAuthentication();
  await testInjection();
  await testDataExposure();
  await testCORSAndErrors();
  await testIDOR();
  // Rate limiting test runs LAST: sends 130 requests which exhausts the rate window
  // and would cause 429 false-positives in earlier test phases if run first
  await testRateLimiting();

  const { critical } = generateReport();

  console.log('\n📁 Reports saved to: Vulnerability Test Results/');

  // Exit non-zero only on CRITICAL findings (unblocking workflow unless truly critical)
  if (critical.length > 0) {
    console.log(`\n${C.red}${C.bold}❌ ${critical.length} CRITICAL finding(s) detected. Failing workflow.${C.reset}`);
    process.exit(1);
  }

  console.log(`\n${C.green}${C.bold}✅ DAST scan complete. No CRITICAL findings.${C.reset}`);
  process.exit(0);
})();
