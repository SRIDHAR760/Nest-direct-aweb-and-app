const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const logger = require('./logger');
const fs = require('fs');
const path = require('path');

class SeleniumUtils {
  static async createDriver(browser = 'chrome', headless = true) {
    logger.info(`Creating Selenium Driver instance: ${browser} (headless: ${headless})`);
    let options = new chrome.Options();
    if (headless) {
      options.addArguments('--headless=new');
    }
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');

    const driver = await new Builder()
      .forBrowser(browser)
      .setChromeOptions(options)
      .build();

    return driver;
  }

  static async waitForElement(driver, locator, timeoutMs = 10000) {
    logger.info(`Waiting for element: ${locator}`);
    return await driver.wait(until.elementLocated(locator), timeoutMs);
  }

  static async click(driver, locator) {
    logger.info(`Clicking element: ${locator}`);
    const el = await this.waitForElement(driver, locator);
    await driver.wait(until.elementIsVisible(el), 5000);
    await el.click();
  }

  static async type(driver, locator, text) {
    logger.info(`Typing "${text}" into element: ${locator}`);
    const el = await this.waitForElement(driver, locator);
    await el.clear();
    await el.sendKeys(text);
  }

  static async captureScreenshot(driver, fileName) {
    const dir = path.join(__dirname, '../reports/failures');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const screenshotPath = path.join(dir, `${fileName}.png`);
    const image = await driver.takeScreenshot();
    fs.writeFileSync(screenshotPath, image, 'base64');
    logger.info(`Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  }
}

module.exports = SeleniumUtils;
