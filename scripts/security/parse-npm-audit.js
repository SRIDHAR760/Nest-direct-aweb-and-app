#!/usr/bin/env node
/**
 * scripts/security/parse-npm-audit.js
 * Parses npm audit JSON and generates dependency vulnerability report.
 */
const fs   = require('fs');
const path = require('path');

const auditPath = path.join(process.cwd(), 'web', 'npm-audit-report.json');
const outputDir = path.join(process.cwd(), 'Vulnerability Test Results');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

let auditData = null;
try {
  const raw = fs.readFileSync(auditPath, 'utf-8');
  auditData = JSON.parse(raw);
} catch (e) {
  console.log('ℹ️  No npm audit report found or parse error — generating empty dependency report.');
}

const vulns = auditData ? Object.values(auditData.vulnerabilities || {}) : [];
const critical = vulns.filter(v => v.severity === 'critical');
const high     = vulns.filter(v => v.severity === 'high');
const medium   = vulns.filter(v => v.severity === 'moderate');
const low      = vulns.filter(v => v.severity === 'low');

const md = `# NestDirect — Dependency Vulnerability Report
> Generated: ${new Date().toISOString()}  
> Source: npm audit (web/package.json)

## Summary

| Severity | Count |
|:---|:---:|
| 🔴 Critical | ${critical.length} |
| 🟠 High | ${high.length} |
| 🟡 Moderate | ${medium.length} |
| 🟢 Low | ${low.length} |
| **Total** | **${vulns.length}** |

---

## Dependency Inventory

| Package | Current | Severity | CVE | Fix Available |
|:---|:---|:---|:---|:---|
${vulns.slice(0, 50).map(v => `| ${v.name} | ${v.range || 'N/A'} | ${v.severity} | ${v.via?.[0]?.url || 'N/A'} | ${v.fixAvailable ? '✅ Yes' : '❌ No'} |`).join('\n')}

---

## Remediation

\`\`\`bash
# Fix automatically fixable vulnerabilities
cd web && npm audit fix

# Force-fix all (review breaking changes first)
cd web && npm audit fix --force
\`\`\`

> **Note:** Review each fix for breaking API changes before applying to production.
`;

fs.writeFileSync(path.join(outputDir, 'dependency-report.md'), md);
console.log(`✅ Dependency report generated. Critical: ${critical.length}, High: ${high.length}`);

if (critical.length > 0) {
  console.log('❌ CRITICAL dependency vulnerabilities found!');
  process.exit(1);
}
