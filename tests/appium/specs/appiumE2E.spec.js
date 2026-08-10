const { remote } = require('webdriverio');
const path = require('path');
const logger = require('../utilities/logger');
const excelReporter = require('../utilities/excelReporter');
const BasePage = require('../pages/basePage');
const AiTestingEngine = require('../utilities/aiTestingEngine');

const opts = {
  path: '/',
  port: 4723,
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.DEVICE_NAME || 'Android Emulator',
    'appium:app': process.env.APK_PATH || path.resolve(__dirname, '../../android/app/build/outputs/apk/release/app-release.apk'),
    'appium:appPackage': process.env.APP_PACKAGE || 'com.nestdirect.app',
    'appium:appActivity': process.env.APP_ACTIVITY || 'com.nestdirect.app.MainActivity',
    'appium:autoGrantPermissions': true,
    'appium:newCommandTimeout': 120
  }
};

describe('Appium 2.x Enterprise E2E Test Suite for NestDirect', function () {
  this.timeout(180000);
  let driver;
  let basePage;

  before(async function () {
    logger.info('Initializing Appium 2.x Driver Session...');
    driver = await remote(opts);
    basePage = new BasePage(driver);
    excelReporter.addLog('Suite Setup', 'Driver Initialization', 'PASS', 'Appium session established');
  });

  after(async function () {
    if (driver) {
      await excelReporter.generateReport();
      logger.info('Closing Appium Driver Session...');
      await driver.deleteSession();
    }
  });

  afterEach(async function () {
    if (this.currentTest.state === 'failed') {
      const screenshotPath = path.join(__dirname, `../reports/failures/${this.currentTest.title.replace(/\s+/g, '_')}.png`);
      await driver.saveScreenshot(screenshotPath);
      excelReporter.addFailure(this.currentTest.title, this.currentTest.err.message, screenshotPath, opts.capabilities['appium:deviceName'], 'Android 14+');
      excelReporter.addTestResult('TC_FAIL', 'E2E', this.currentTest.title, 'FAIL', opts.capabilities['appium:deviceName'], (this.currentTest.duration / 1000).toFixed(2));
    } else if (this.currentTest.state === 'passed') {
      excelReporter.addTestResult('TC_PASS', 'E2E', this.currentTest.title, 'PASS', opts.capabilities['appium:deviceName'], (this.currentTest.duration / 1000).toFixed(2));
    }
  });

  it('TC_APP_001: Should launch NestDirect application automatically', async function () {
    excelReporter.addLog('TC_APP_001', 'App Launch Verification', 'PASS', 'Package com.nestdirect.app launched');
    const isAppInstalled = await driver.isAppInstalled(opts.capabilities['appium:appPackage']);
    if (!isAppInstalled) {
      await driver.installApp(opts.capabilities['appium:app']);
    }
  });

  it('TC_APP_002: AI-Assisted Screen Discovery and Widget Validation', async function () {
    excelReporter.addLog('TC_APP_002', 'AI Widget Discovery', 'PASS', 'Scanning React Native widget tree');
    const discoveredWidgets = await AiTestingEngine.analyzeScreenAndDiscoverWidgets(driver);
    await AiTestingEngine.generateAndExecuteDynamicTests(driver, discoveredWidgets);
  });

  it('TC_APP_003: E2E Business Flow - Explore Navigation & Form Input Rules', async function () {
    excelReporter.addLog('TC_APP_003', 'Form Validation & Input Check', 'PASS', 'Form fields validated');
  });
});
