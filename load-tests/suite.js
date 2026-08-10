import http from 'k6/http';
import { check, sleep } from 'k6';
import { config } from './config.js';

export const options = {
  stages: [
    { duration: '15s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '15s', target: 0 },
  ],
  thresholds: config.thresholds,
};

export default function () {
  // 1. Health Check GET API
  const healthRes = http.get(`${config.baseUrl}/api/health`);
  check(healthRes, {
    'Health status is 200': (r) => r.status === 200,
    'Server status is healthy': (r) => r.json().status === 'healthy',
  });

  sleep(1);

  // 2. Active Session Sync GET API
  const sessionRes = http.get(`${config.baseUrl}/api/sync-session`);
  check(sessionRes, {
    'Session sync status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
