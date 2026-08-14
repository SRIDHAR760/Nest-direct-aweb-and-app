#!/usr/bin/env node
/**
 * scripts/security/check-critical-findings.js
 * Final gate: fails the workflow if CRITICAL findings exist in any report.
 */
const fs   = require('fs');
const path = require('path');

const outputDir = path.join(process.cwd(), 'Vulnerability Test Results');

let allFindings = [];

// Load from aggregated JSON if available
const allFindingsPath = path.join(outputDir, 'all-findings.json');
if (fs.existsSync(allFindingsPath)) {
  try {
    allFindings = JSON.parse(fs.readFileSync(allFindingsPath, 'utf-8'));
  } catch (_) {}
}

const critical = allFindings.filter(f => f.severity === 'CRITICAL');

if (critical.length > 0) {
  console.error(`\n❌ WORKFLOW FAILED — ${critical.length} CRITICAL security finding(s) detected:`);
  critical.forEach((f, i) => {
    console.error(`   ${i + 1}. [${f.endpoint || f.file}] ${f.type}: ${f.description}`);
  });
  console.error('\n   Fix all CRITICAL findings before merging to main.\n');
  process.exit(1);
} else {
  console.log('\n✅ No CRITICAL findings detected. Workflow passes security gate.');
  process.exit(0);
}
