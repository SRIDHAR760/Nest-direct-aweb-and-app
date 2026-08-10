const logger = require('../utilities/logger');
const { By } = require('selenium-webdriver');

class SeleniumBasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async open(url) {
    logger.info(`Navigating to URL: ${url}`);
    await this.driver.get(url);
  }

  async getTitle() {
    const title = await this.driver.getTitle();
    logger.info(`Page Title: ${title}`);
    return title;
  }

  async discoverRoutesAndForms() {
    logger.info(`[Dynamic Discovery Engine] Scanning React application DOM for forms, inputs, and routes...`);
    const forms = await this.driver.findElements(By.tagName('form'));
    const inputs = await this.driver.findElements(By.tagName('input'));
    const buttons = await this.driver.findElements(By.tagName('button'));

    logger.info(`[Dynamic Discovery Engine] Found ${forms.length} forms, ${inputs.length} input fields, ${buttons.length} buttons.`);
    return { formCount: forms.length, inputCount: inputs.length, buttonCount: buttons.length };
  }
}

module.exports = SeleniumBasePage;
