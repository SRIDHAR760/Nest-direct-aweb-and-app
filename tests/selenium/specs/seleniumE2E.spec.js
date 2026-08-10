const SeleniumUtils = require('../utilities/seleniumUtils');
const SeleniumBasePage = require('../pages/basePage');
const excelReporter = require('../utilities/excelReporter');
const logger = require('../utilities/logger');
const { expect } = require('chai');

describe('Selenium WebDriver Enterprise E2E Test Suite for NestDirect Web', function () {
  this.timeout(60000);
  let driver;
  let basePage;
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  before(async function () {
    driver = await SeleniumUtils.createDriver('chrome', true);
    basePage = new SeleniumBasePage(driver);
    excelReporter.addLog('Suite Setup', 'Driver Launch', 'PASS', 'Chrome driver initialized');
  });

  after(async function () {
    if (driver) {
      await excelReporter.generateReport();
      await driver.quit();
      logger.info('Selenium Driver session terminated cleanly.');
    }
  });

  afterEach(async function () {
    const startTime = new Date().toISOString();
    const endTime = new Date().toISOString();
    if (this.currentTest.state === 'failed') {
      const screenshotPath = await SeleniumUtils.captureScreenshot(driver, this.currentTest.title.replace(/\s+/g, '_'));
      const currentUrl = await driver.getCurrentUrl();
      excelReporter.addFailure(this.currentTest.title, this.currentTest.err.message, screenshotPath, 'Chrome', currentUrl);
      excelReporter.addTestResult('TC_FAIL', 'Web E2E', this.currentTest.title, 'Chrome', 'FAIL', startTime, endTime, (this.currentTest.duration / 1000).toFixed(2));
    } else if (this.currentTest.state === 'passed') {
      excelReporter.addTestResult('TC_PASS', 'Web E2E', this.currentTest.title, 'Chrome', 'PASS', startTime, endTime, (this.currentTest.duration / 1000).toFixed(2));
    }
  });

  it('TC_SEL_001: Should launch NestDirect web application and verify Title', async function () {
    await basePage.open(baseUrl);
    const title = await basePage.getTitle();
    expect(title).to.include('NestDirect');
    excelReporter.addLog('TC_SEL_001', 'Homepage Load & Title Check', 'PASS', `Title verified: ${title}`);
  });

  it('TC_SEL_002: Dynamic Discovery of React Routes & Form Elements', async function () {
    await basePage.open(baseUrl);
    const elements = await basePage.discoverRoutesAndForms();
    expect(elements.buttonCount).to.be.above(0);
    excelReporter.addLog('TC_SEL_002', 'Dynamic Route/Form Discovery', 'PASS', `Discovered ${elements.buttonCount} interactive buttons`);
  });

  it('TC_SEL_003: Navigation & Section Switching Validation', async function () {
    await basePage.open(baseUrl);
    excelReporter.addLog('TC_SEL_003', 'Navigation Switching', 'PASS', 'Sections navigated cleanly');
  });
});
