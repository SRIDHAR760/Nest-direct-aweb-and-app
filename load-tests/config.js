export const config = {
  baseUrl: __ENV.BASE_URL || 'http://localhost:3000',
  thresholds: {
    http_req_duration: ['p(95)<500', 'avg<200'],
    http_req_failed: ['rate<0.01'],
  },
};
