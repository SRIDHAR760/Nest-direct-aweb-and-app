const path = require('path');
const fs = require('fs');

// Ensure reports directory exists before running tests
const reportsDir = path.join(__dirname, 'selenium/reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const Mocha = require('mocha');
const mocha = new Mocha({
  timeout: 30000,
  reporter: 'spec'
});

const specFile = path.join(__dirname, 'selenium/specs/seleniumE2E.spec.js');
console.log(`[E2E Runner] Adding spec file: ${specFile}`);
mocha.addFile(specFile);

mocha.run(failures => {
  if (failures) {
    console.error(`[E2E Runner] ❌ ${failures} test(s) failed.`);
    process.exit(1);
  } else {
    console.log('[E2E Runner] ✅ All tests passed cleanly!');
    process.exit(0);
  }
});
