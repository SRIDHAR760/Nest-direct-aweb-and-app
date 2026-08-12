const { remote } = require('webdriverio');
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const logger = require('../utilities/logger');
const excelReporter = require('../utilities/excelReporter');

const APK_PATH = process.env.APK_PATH || path.resolve(
  __dirname,
  '../../../android/app/build/outputs/apk/debug/app-debug.apk'
);

const opts = {
  path: '/',
  port: 4723,
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.DEVICE_NAME || 'Android Emulator',
    'appium:app': APK_PATH,
    'appium:appPackage': process.env.APP_PACKAGE || 'com.nestdirect.app',
    'appium:appActivity': process.env.APP_ACTIVITY || 'com.nestdirect.app.MainActivity',
    'appium:autoGrantPermissions': true,
    'appium:newCommandTimeout': 120,
    'appium:uiautomator2ServerInstallTimeout': 120000,
    'appium:adbExecTimeout': 120000
  }
};

describe('Appium 3.x Android E2E Test Suite for NestDirect', function () {
  this.timeout(180000);
  let driver;

  before(async function () {
    assert.ok(fs.existsSync(APK_PATH), `APK does not exist: ${APK_PATH}`);
    fs.mkdirSync(path.join(__dirname, '../reports/failures'), { recursive: true });
    logger.info('Initializing Appium 3.x Driver Session...');
    driver = await remote(opts);
    excelReporter.addLog('Suite Setup', 'Driver Initialization', 'PASS', 'Appium session established');
  });

  after(async function () {
    try {
      await excelReporter.generateReport();
    } finally {
      if (!driver) return;
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
    const isAppInstalled = await driver.isAppInstalled(opts.capabilities['appium:appPackage']);
    assert.strictEqual(isAppInstalled, true, 'NestDirect APK was not installed');
    excelReporter.addLog('TC_APP_001', 'App Launch Verification', 'PASS', 'Package com.nestdirect.app installed');
  });

  it('TC_APP_002: Should keep the NestDirect package and MainActivity in foreground', async function () {
    const currentPackage = await driver.getCurrentPackage();
    const currentActivity = await driver.getCurrentActivity();
    assert.strictEqual(currentPackage, 'com.nestdirect.app');
    assert.ok(currentActivity.endsWith('.MainActivity'), `Unexpected activity: ${currentActivity}`);
    excelReporter.addLog('TC_APP_002', 'Foreground App Verification', 'PASS', `${currentPackage}/${currentActivity}`);
  });

  it('TC_APP_003: Should display the WebView without the connection-error screen', async function () {
    const webView = await driver.$('android=new UiSelector().className("android.webkit.WebView")');
    await webView.waitForDisplayed({ timeout: 30000 });

    const offlineMessage = await driver.$('android=new UiSelector().textContains("NestDirect connection error")');
    const offlineVisible = await offlineMessage.isExisting() && await offlineMessage.isDisplayed();
    assert.strictEqual(offlineVisible, false, 'Android wrapper displayed its connection-error screen');
    excelReporter.addLog('TC_APP_003', 'WebView Connectivity', 'PASS', 'WebView visible and offline message hidden');
  });
});
