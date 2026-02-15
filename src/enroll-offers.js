const { setTimeout } = require("timers/promises");
const { openInSafari, getSafariUrl, runJsInSafari } = require("./safari");

const OFFERS_URL =
  "https://global.americanexpress.com/offers/eligible?intlink=US-AmexOffers-LandingPage";

async function enrollOffers() {
  console.log("Navigating to Amex Offers page...");
  openInSafari(OFFERS_URL);

  // Wait for the offers page to load
  await setTimeout(5000);

  // Wait until we're on the offers page
  for (let i = 0; i < 15; i++) {
    try {
      const url = getSafariUrl();
      if (url.includes("/offers")) break;
    } catch (e) {}
    await setTimeout(2000);
  }

  console.log("Waiting for offers to load...");
  await setTimeout(5000);

  // Scroll down to load all offers
  console.log("Scrolling to load all offers...");
  for (let i = 0; i < 10; i++) {
    runJsInSafari("window.scrollBy(0, 500)");
    await setTimeout(500);
  }
  // Scroll back to top
  runJsInSafari("window.scrollTo(0, 0)");
  await setTimeout(2000);

  // Find and click all "Add to Card" buttons
  const countResult = runJsInSafari(
    `document.querySelectorAll('button[title*="Add to Card"], button[aria-label*="Add to Card"]').length`
  );
  let totalButtons = parseInt(countResult, 10) || 0;

  if (totalButtons === 0) {
    // Try alternate selectors
    const altCount = runJsInSafari(
      `Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Add to Card')).length`
    );
    totalButtons = parseInt(altCount, 10) || 0;
  }

  if (totalButtons === 0) {
    console.log("No unenrolled offers found. You may already be enrolled in everything!");
    return { enrolled: 0, failed: 0 };
  }

  console.log(`Found ${totalButtons} offer(s) to enroll.\n`);

  let enrolled = 0;
  let failed = 0;

  for (let i = 0; i < totalButtons; i++) {
    try {
      // Always click the first available "Add" button (they disappear after clicking)
      const clicked = runJsInSafari(`
        (function() {
          var btn = document.querySelector('button[title*="Add to Card"], button[aria-label*="Add to Card"]')
            || Array.from(document.querySelectorAll('button')).find(function(b) { return b.textContent.includes('Add to Card'); });
          if (btn) {
            btn.scrollIntoView({block: 'center'});
            btn.click();
            return 'clicked';
          }
          return 'not_found';
        })()
      `);

      if (clicked === "clicked") {
        enrolled++;
        console.log(`  [${enrolled}/${totalButtons}] Enrolled in offer.`);
      } else {
        console.log(`  No more buttons found at index ${i}.`);
        break;
      }

      // Wait for the enrollment to register before clicking the next one
      await setTimeout(2000);
    } catch (err) {
      console.error(`  Failed on offer #${i + 1}: ${err.message}`);
      failed++;
    }
  }

  console.log(
    `\nDone! Enrolled: ${enrolled}, Failed: ${failed} out of ${totalButtons} offers.`
  );
  return { enrolled, failed };
}

module.exports = { enrollOffers };
