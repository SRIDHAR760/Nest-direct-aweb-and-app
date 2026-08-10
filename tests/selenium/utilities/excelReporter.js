const ExcelJS = require('exceljs');
const path = require('path');
const logger = require('./logger');

class SeleniumExcelReporter {
  constructor(filePath = path.join(__dirname, '../reports/E2E_Report.xlsx')) {
    this.filePath = filePath;
    this.results = [];
    this.failures = [];
    this.logs = [];
    this.startTime = new Date();
  }

  addTestResult(testId, module, scenarioName, browser, status, startTime, endTime, duration) {
    this.results.push({ testId, module, scenarioName, browser, status, startTime, endTime, duration });
  }

  addFailure(testName, failureReason, screenshotPath, browser, url) {
    this.failures.push({ testName, failureReason, screenshotPath, browser, url });
  }

  addLog(testName, stepDescription, result, remarks) {
    this.logs.push({ timestamp: new Date().toISOString(), testName, stepDescription, result, remarks });
  }

  async generateReport(environment = 'Production / Staging') {
    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Summary
    const summarySheet = workbook.addWorksheet('Summary');
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = total - (passed + failed);
    const passPercentage = total > 0 ? ((passed / total) * 100).toFixed(2) + '%' : '0%';
    const duration = ((new Date() - this.startTime) / 1000).toFixed(2) + 's';

    summarySheet.columns = [
      { header: 'Execution Date', key: 'date', width: 25 },
      { header: 'Environment', key: 'env', width: 25 },
      { header: 'Total Tests', key: 'total', width: 15 },
      { header: 'Passed', key: 'passed', width: 15 },
      { header: 'Failed', key: 'failed', width: 15 },
      { header: 'Skipped', key: 'skipped', width: 15 },
      { header: 'Pass Percentage', key: 'passRate', width: 20 },
      { header: 'Execution Duration', key: 'duration', width: 20 }
    ];

    summarySheet.addRow({
      date: new Date().toLocaleString(),
      env: environment,
      total, passed, failed, skipped,
      passRate: passPercentage,
      duration
    });

    // Sheet 2: Test Cases
    const testSheet = workbook.addWorksheet('Test Cases');
    testSheet.columns = [
      { header: 'Test ID', key: 'testId', width: 15 },
      { header: 'Module', key: 'module', width: 20 },
      { header: 'Scenario Name', key: 'scenarioName', width: 40 },
      { header: 'Browser', key: 'browser', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Start Time', key: 'startTime', width: 25 },
      { header: 'End Time', key: 'endTime', width: 25 },
      { header: 'Duration (s)', key: 'duration', width: 15 }
    ];
    this.results.forEach(r => testSheet.addRow(r));

    // Sheet 3: Failed Tests
    const failSheet = workbook.addWorksheet('Failed Tests');
    failSheet.columns = [
      { header: 'Test Name', key: 'testName', width: 30 },
      { header: 'Failure Reason', key: 'failureReason', width: 50 },
      { header: 'Screenshot Path', key: 'screenshotPath', width: 40 },
      { header: 'Browser', key: 'browser', width: 15 },
      { header: 'URL', key: 'url', width: 40 }
    ];
    this.failures.forEach(f => failSheet.addRow(f));

    // Sheet 4: Execution Logs
    const logSheet = workbook.addWorksheet('Execution Logs');
    logSheet.columns = [
      { header: 'Timestamp', key: 'timestamp', width: 25 },
      { header: 'Test Name', key: 'testName', width: 30 },
      { header: 'Step Description', key: 'stepDescription', width: 40 },
      { header: 'Result', key: 'result', width: 15 },
      { header: 'Remarks', key: 'remarks', width: 30 }
    ];
    this.logs.forEach(l => logSheet.addRow(l));

    await workbook.xlsx.writeFile(this.filePath);
    logger.info(`Selenium Excel Report generated cleanly at: ${this.filePath}`);
  }
}

module.exports = new SeleniumExcelReporter();
