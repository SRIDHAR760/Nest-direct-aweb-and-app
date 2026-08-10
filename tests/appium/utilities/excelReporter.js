const ExcelJS = require('exceljs');
const path = require('path');
const logger = require('./logger');

class ExcelReporter {
  constructor(filePath = path.join(__dirname, '../reports/React_native_E2E_Report.xlsx')) {
    this.filePath = filePath;
    this.results = [];
    this.failures = [];
    this.logs = [];
    this.startTime = new Date();
  }

  addTestResult(testId, module, scenario, status, device, duration) {
    this.results.push({ testId, module, scenario, status, device, duration });
  }

  addFailure(testName, failureReason, screenshotPath, device, androidVersion) {
    this.failures.push({ testName, failureReason, screenshotPath, device, androidVersion });
  }

  addLog(testName, step, result, remarks) {
    this.logs.push({ timestamp: new Date().toISOString(), testName, step, result, remarks });
  }

  async generateReport(deviceName = 'Android Emulator / Pixel Device', androidVersion = 'Android 14+') {
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1 - Summary
    const summarySheet = workbook.addWorksheet('Summary');
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = total - (passed + failed);
    const passPercentage = total > 0 ? ((passed / total) * 100).toFixed(2) + '%' : '0%';
    const duration = ((new Date() - this.startTime) / 1000).toFixed(2) + 's';

    summarySheet.columns = [
      { header: 'Execution Date', key: 'date', width: 25 },
      { header: 'Device Name', key: 'device', width: 30 },
      { header: 'Android Version', key: 'version', width: 20 },
      { header: 'Total Tests', key: 'total', width: 15 },
      { header: 'Passed', key: 'passed', width: 15 },
      { header: 'Failed', key: 'failed', width: 15 },
      { header: 'Skipped', key: 'skipped', width: 15 },
      { header: 'Pass Percentage', key: 'passRate', width: 20 },
      { header: 'Duration', key: 'duration', width: 15 }
    ];

    summarySheet.addRow({
      date: new Date().toLocaleString(),
      device: deviceName,
      version: androidVersion,
      total, passed, failed, skipped,
      passRate: passPercentage,
      duration
    });

    // Sheet 2 - Test Cases
    const testSheet = workbook.addWorksheet('Test Cases');
    testSheet.columns = [
      { header: 'Test ID', key: 'testId', width: 15 },
      { header: 'Module', key: 'module', width: 20 },
      { header: 'Scenario', key: 'scenario', width: 40 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Device', key: 'device', width: 25 },
      { header: 'Duration (s)', key: 'duration', width: 15 }
    ];
    this.results.forEach(r => testSheet.addRow(r));

    // Sheet 3 - Failed Tests
    const failSheet = workbook.addWorksheet('Failed Tests');
    failSheet.columns = [
      { header: 'Test Name', key: 'testName', width: 30 },
      { header: 'Failure Reason', key: 'failureReason', width: 50 },
      { header: 'Screenshot Path', key: 'screenshotPath', width: 40 },
      { header: 'Device', key: 'device', width: 25 },
      { header: 'Android Version', key: 'androidVersion', width: 20 }
    ];
    this.failures.forEach(f => failSheet.addRow(f));

    // Sheet 4 - Execution Logs
    const logSheet = workbook.addWorksheet('Execution Logs');
    logSheet.columns = [
      { header: 'Timestamp', key: 'timestamp', width: 25 },
      { header: 'Test Name', key: 'testName', width: 30 },
      { header: 'Step', key: 'step', width: 40 },
      { header: 'Result', key: 'result', width: 15 },
      { header: 'Remarks', key: 'remarks', width: 30 }
    ];
    this.logs.forEach(l => logSheet.addRow(l));

    await workbook.xlsx.writeFile(this.filePath);
    logger.info(`Appium Excel Report generated cleanly at: ${this.filePath}`);
  }
}

module.exports = new ExcelReporter();
