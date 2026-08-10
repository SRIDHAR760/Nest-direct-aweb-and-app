import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '15s', target: 20 },
    { duration: '30s', target: 50 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'avg<300'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  // ── 1. Health Check GET ─────────────────────────────────────────────────────
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    '✅ Health status 200': (r) => r.status === 200,
    '✅ Status is healthy': (r) => {
      try {
        return r.json('status') === 'healthy';
      } catch (e) {
        return false;
      }
    },
  });

  sleep(0.5);

  // ── 2. Session Sync GET ─────────────────────────────────────────────────────
  const sessionRes = http.get(`${BASE_URL}/api/sync-session`);
  check(sessionRes, {
    '✅ Session sync status 200': (r) => r.status === 200,
  });

  sleep(0.5);
}
