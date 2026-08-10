const logger = require('../utilities/logger');

class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async waitForElement(selector, timeoutMs = 10000) {
    logger.info(`Waiting for element: ${selector}`);
    const el = await this.driver.$(selector);
    await el.waitForDisplayed({ timeout: timeoutMs });
    return el;
  }

  async click(selector) {
    logger.info(`Clicking element: ${selector}`);
    const el = await this.waitForElement(selector);
    await el.click();
  }

  async setValue(selector, text) {
    logger.info(`Entering text "${text}" into element: ${selector}`);
    const el = await this.waitForElement(selector);
    await el.setValue(text);
  }

  async getText(selector) {
    const el = await this.waitForElement(selector);
    const text = await el.getText();
    logger.info(`Extracted text "${text}" from element: ${selector}`);
    return text;
  }

  // React Native Finder Helper Support
  async findByValueKey(key) {
    return await this.waitForElement(`~${key}`);
  }

  async findByText(text) {
    return await this.waitForElement(`//*[@text='${text}']`);
  }

  async findBySemanticsLabel(label) {
    return await this.waitForElement(`~${label}`);
  }
}

module.exports = BasePage;
