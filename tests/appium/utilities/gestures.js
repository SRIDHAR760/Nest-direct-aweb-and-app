const logger = require('./logger');

class Gestures {
  static async tap(driver, element) {
    logger.info(`Performing gesture: Tap`);
    await element.click();
  }

  static async doubleTap(driver, element) {
    logger.info(`Performing gesture: Double Tap`);
    await driver.action('pointer')
      .move({ duration: 0, origin: element })
      .down({ button: 0 })
      .up({ button: 0 })
      .pause(100)
      .down({ button: 0 })
      .up({ button: 0 })
      .perform();
  }

  static async longPress(driver, element, durationMs = 1500) {
    logger.info(`Performing gesture: Long Press (${durationMs}ms)`);
    await driver.action('pointer')
      .move({ duration: 0, origin: element })
      .down({ button: 0 })
      .pause(durationMs)
      .up({ button: 0 })
      .perform();
  }

  static async swipe(driver, startX, startY, endX, endY, durationMs = 800) {
    logger.info(`Performing gesture: Swipe from (${startX},${startY}) to (${endX},${endY})`);
    await driver.action('pointer')
      .move({ duration: 0, x: startX, y: startY })
      .down({ button: 0 })
      .pause(durationMs)
      .move({ duration: durationMs, x: endX, y: endY })
      .up({ button: 0 })
      .perform();
  }

  static async scrollDown(driver) {
    logger.info(`Performing gesture: Scroll Down`);
    await this.swipe(driver, 500, 1500, 500, 300);
  }

  static async scrollUp(driver) {
    logger.info(`Performing gesture: Scroll Up`);
    await this.swipe(driver, 500, 300, 500, 1500);
  }
}

module.exports = Gestures;
