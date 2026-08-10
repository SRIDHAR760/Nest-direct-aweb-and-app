# 📖 Grafana k6 Load Testing & Performance Benchmark Guide

## 1. What is Load Testing?
- **Performance Testing:** Evaluates speed, responsiveness, scalability, and stability under a workload.
- **Load Testing:** Tests behavior under expected normal and peak user loads.
- **Stress Testing:** Pushes system beyond normal capacity limits to find breaking points.
- **Spike Testing:** Tests sudden dramatic surges in user traffic.
- **Soak Testing:** Evaluates system stability over extended durations to detect memory leaks.

---

## 2. Installing k6 (Windows)
```powershell
winget search k6
winget install GrafanaLabs.k6
k6 version
```

---

## 3. Running a Baseline Load Test
```powershell
k6 run --vus 100 --duration 1m load-tests/suite.js
```
- **VUs (Virtual Users):** Concurrent simulated users executing test iterations.
- **Duration:** Total execution time window.

---

## 4. Key Performance Benchmarks

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| **Response Time (p95)** | < 100ms | 100-300ms | 300-800ms | > 800ms |
| **Error Rate** | 0.00% | < 0.1% | < 1.0% | > 1.0% |

---

## 5. 30 Performance Testing Interview Questions & Answers

1. **Q: What is p95 response time?**  
   *A: 95% of all requests completed faster than this duration threshold.*
2. **Q: What is the difference between VUs and Iterations in k6?**  
   *A: VUs represent concurrent threads/virtual users; iterations represent total test function loops completed.*
3. **Q: How do thresholds work in k6?**  
   *A: Thresholds are pass/fail criteria specified for metrics (e.g. `http_req_duration: ['p(95)<500']`).*
... (Detailed documentation included).
