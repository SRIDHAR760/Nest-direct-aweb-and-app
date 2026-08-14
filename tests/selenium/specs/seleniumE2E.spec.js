const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const excelReporter = require('../utilities/excelReporter');
const logger = require('../utilities/logger');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Helper: simple HTTP GET returning { status, body }
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

/**
 * Helper: simple HTTP POST returning { status, body }
 */
function httpPost(url, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 3000,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

describe('NestDirect Web API & Selenium E2E Automation Suite', function () {
  this.timeout(30000);

  before(function () {
    const dir = path.join(__dirname, '../reports/failures');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    logger.info(`Starting NestDirect Web E2E Suite against: ${BASE_URL}`);
    excelReporter.addLog('Suite Setup', 'HTTP client initialized', 'PASS', `Target: ${BASE_URL}`);
  });

  after(async function () {
    await excelReporter.generateReport();
    logger.info('NestDirect Web E2E Suite complete. Excel report generated.');
  });

  afterEach(function () {
    const status = this.currentTest.state === 'passed' ? 'PASS' : 'FAIL';
    const startTime = new Date().toISOString();
    excelReporter.addTestResult(
      `TC_${status}`,
      'Web API E2E',
      this.currentTest.title,
      'Node HTTP',
      status,
      startTime,
      new Date().toISOString(),
      (this.currentTest.duration / 1000).toFixed(2)
    );
    if (this.currentTest.state === 'failed') {
      excelReporter.addFailure(
        this.currentTest.title,
        this.currentTest.err ? this.currentTest.err.message : 'Unknown error',
        'N/A',
        'Node HTTP',
        BASE_URL
      );
    }
  });

  // ── TC_SEL_001: Health Endpoint ───────────────────────────────────────────
  it('TC_SEL_001: GET /api/health — should return 200 with healthy status', async function () {
    const { status, body } = await httpGet(`${BASE_URL}/api/health`);
    const json = JSON.parse(body);
    assert.strictEqual(status, 200);
    assert.strictEqual(json.status, 'healthy');
    assert.ok(json.uptime !== undefined);
    excelReporter.addLog('TC_SEL_001', 'GET /api/health', 'PASS', `Status: ${status}, uptime: ${json.uptime}`);
    logger.info(`TC_SEL_001 PASS — status: ${json.status}, uptime: ${json.uptime}`);
  });

  // ── TC_SEL_002: Session Sync GET ─────────────────────────────────────────
  it('TC_SEL_002: GET /api/sync-session — should return 200 with session key', async function () {
    const { status, body } = await httpGet(`${BASE_URL}/api/sync-session`);
    const json = JSON.parse(body);
    assert.strictEqual(status, 200);
    assert.ok(json.hasOwnProperty('session'));
    excelReporter.addLog('TC_SEL_002', 'GET /api/sync-session', 'PASS', `Session key present: ${json.session !== undefined}`);
    logger.info(`TC_SEL_002 PASS — session: ${JSON.stringify(json.session)}`);
  });

  // ── TC_SEL_003: Session Sync POST with valid payload ─────────────────────
  it('TC_SEL_003: POST /api/sync-session — should accept a valid user session', async function () {
    const payload = { uid: 'test-user-ci-001', email: 'ci@nestdirect.com', displayName: 'CI Test User' };
    const { status, body } = await httpPost(`${BASE_URL}/api/sync-session`, payload);
    const json = JSON.parse(body);
    assert.strictEqual(status, 200);
    assert.strictEqual(json.status, 'synced');
    assert.strictEqual(json.session.uid, 'test-user-ci-001');
    assert.strictEqual(json.session.displayName, 'CI Test User');
    excelReporter.addLog('TC_SEL_003', 'POST /api/sync-session', 'PASS', `Session synced for uid: ${json.session.uid}`);
    logger.info(`TC_SEL_003 PASS — session synced for: ${json.session.displayName}`);
  });

  // ── TC_SEL_004: Session Sync POST — clear session ─────────────────────────
  it('TC_SEL_004: POST /api/sync-session with empty body — should clear session', async function () {
    const { status, body } = await httpPost(`${BASE_URL}/api/sync-session`, {});
    const json = JSON.parse(body);
    assert.strictEqual(status, 200);
    assert.strictEqual(json.status, 'cleared');
    assert.strictEqual(json.session, null);
    excelReporter.addLog('TC_SEL_004', 'POST /api/sync-session (clear)', 'PASS', 'Session cleared successfully');
    logger.info(`TC_SEL_004 PASS — session cleared`);
  });

  // ── TC_SEL_005: Rate Limiting Presence Check ─────────────────────────────
  it('TC_SEL_005: GET /api/health — Rate-limit header should not trigger on normal use', async function () {
    const { status } = await httpGet(`${BASE_URL}/api/health`);
    assert.notStrictEqual(status, 429);
    excelReporter.addLog('TC_SEL_005', 'Rate Limit Baseline Check', 'PASS', `Status was ${status} (not 429)`);
    logger.info(`TC_SEL_005 PASS — rate limit not triggered`);
  });

  // ── TC_SEL_006: Agreement Generator — Missing Required Fields (400 Bad Request) ──
  it('TC_SEL_006: POST /api/generate-agreement — should return 400 when missing required parameters', async function () {
    const { status, body } = await httpPost(`${BASE_URL}/api/generate-agreement`, { rent: 25000 });
    const json = JSON.parse(body);
    assert.strictEqual(status, 400);
    assert.ok(json.error !== undefined);
    excelReporter.addLog('TC_SEL_006', 'POST /api/generate-agreement (validation)', 'PASS', 'Correctly rejected missing fields');
    logger.info(`TC_SEL_006 PASS — validation rejected missing fields`);
  });

  // ── TC_SEL_007: Agreement Generator — Valid Agreement Generation ────────
  it('TC_SEL_007: POST /api/generate-agreement — should generate agreement draft with required fields', async function () {
    const payload = { propertyTitle: 'Adyar Luxury 2BHK', rent: 30000, tenantName: 'CI Tester' };
    const { status, body } = await httpPost(`${BASE_URL}/api/generate-agreement`, payload);
    const json = JSON.parse(body);
    assert.strictEqual(status, 200);
    assert.ok(json.agreement !== undefined);
    excelReporter.addLog('TC_SEL_007', 'POST /api/generate-agreement (success)', 'PASS', 'Agreement generated cleanly');
    logger.info(`TC_SEL_007 PASS — agreement text returned`);
  });

  // ── TC_SEL_008: Load Test Engine API Endpoint ────────────────────────────
  it('TC_SEL_008: POST /api/run-load-test — should calculate load metrics simulation', async function () {
    const { status, body } = await httpPost(`${BASE_URL}/api/run-load-test`, { vus: 50, durationSec: 10 });
    const json = JSON.parse(body);
    assert.strictEqual(status, 200);
    assert.ok(json.summary !== undefined);
    excelReporter.addLog('TC_SEL_008', 'POST /api/run-load-test', 'PASS', 'Load metrics calculated');
    logger.info(`TC_SEL_008 PASS — total requests: ${json.summary.totalRequests}`);
  });
});
