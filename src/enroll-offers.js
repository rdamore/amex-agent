const { setTimeout } = require("timers/promises");

const OFFERS_URL =
  "https://global.americanexpress.com/offers/eligible?intlink=US-AmexOffers-LandingPage";

async function enrollOffers(page) {
  console.log("Navigating to Amex Offers page...");
  await page.goto(OFFERS_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});

  console.log("Waiting for offers to load...");
  // Wait for the offer cards to appear
  await page
    .locator('[data-testid="offer-card"], .offer-card, .offers-list')
    .first()
    .waitFor({ state: "visible", timeout: 30000 })
    .catch(() => {
      console.log("Could not detect offer cards via test IDs, will try generic selectors.");
    });

  // Give the page a moment to finish rendering all offers
  await setTimeout(3000);

  // Scroll down to load any lazy-loaded offers
  await autoScroll(page);
  await setTimeout(2000);

  // Find all "Add" / "+" buttons for unenrolled offers.
  // Amex uses several possible selectors — try them in priority order.
  const addButtonSelectors = [
    'button[title="Add to Card"]',
    'button:has-text("Add to Card")',
    'button:has-text("+ Add to Card")',
    'button[aria-label*="Add to Card"]',
    '[data-testid="add-offer-button"]',
    'button:has(svg path[d*="M"])', // generic "+" icon buttons inside offer cards
  ];

  let addButtons = [];
  for (const selector of addButtonSelectors) {
    addButtons = await page.locator(selector).all();
    if (addButtons.length > 0) {
      console.log(`Found ${addButtons.length} offer(s) to enroll using selector: ${selector}`);
      break;
    }
  }

  if (addButtons.length === 0) {
    console.log("No unenrolled offers found. You may already be enrolled in all offers.");
    return { enrolled: 0, skipped: 0, failed: 0 };
  }

  let enrolled = 0;
  let failed = 0;

  for (let i = 0; i < addButtons.length; i++) {
    try {
      const button = addButtons[i];

      // Scroll the button into view
      await button.scrollIntoViewIfNeeded();
      await setTimeout(500);

      // Get offer name for logging if possible
      const card = button.locator("xpath=ancestor::*[contains(@class,'offer')]").first();
      const offerName = await card.textContent().catch(() => `Offer #${i + 1}`);
      const label = offerName ? offerName.substring(0, 60).trim() : `Offer #${i + 1}`;

      console.log(`[${i + 1}/${addButtons.length}] Enrolling: ${label}...`);
      await button.click();

      // Wait briefly for the enrollment to register
      await setTimeout(1500);
      enrolled++;
      console.log(`  -> Enrolled successfully.`);
    } catch (err) {
      console.error(`  -> Failed to enroll offer #${i + 1}: ${err.message}`);
      failed++;
    }
  }

  const result = { enrolled, skipped: 0, failed };
  console.log(
    `\nEnrollment complete: ${enrolled} enrolled, ${failed} failed out of ${addButtons.length} offers.`
  );
  return result;
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
      // Safety timeout
      window.setTimeout(() => {
        clearInterval(timer);
        resolve();
      }, 15000);
    });
  });
}

module.exports = { enrollOffers };
