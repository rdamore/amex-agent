const { chromium } = require("playwright");
const { login } = require("./login");
const { enrollOffers } = require("./enroll-offers");

async function runAgent() {
  console.log(`\n========================================`);
  console.log(`Amex Offer Enrollment Agent`);
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`========================================\n`);

  const browser = await chromium.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();

  try {
    // Step 1: Login
    await login(page);

    // Step 2 & 3: Navigate to offers and enroll
    const result = await enrollOffers(page);

    console.log(`\nAgent finished at: ${new Date().toISOString()}`);
    return result;
  } catch (err) {
    // Take a screenshot on failure for debugging
    const screenshotDir = "screenshots";
    const fs = require("fs");
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir);
    const screenshotPath = `${screenshotDir}/error-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
    console.error(`Screenshot saved to ${screenshotPath}`);
    throw err;
  } finally {
    await browser.close();
  }
}

module.exports = { runAgent };
