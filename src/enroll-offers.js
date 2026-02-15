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

  console.log("Waiting for offers to fully load...");
  await setTimeout(8000);

  // First, discover what the "+" add buttons look like
  console.log("Discovering add buttons on page...");
  try {
    const discovery = runJsInSafari(
      "JSON.stringify(Array.from(document.querySelectorAll('button')).slice(0, 30).map(function(b) { return { text: (b.textContent || '').trim().substring(0, 30), title: b.title, ariaLabel: b.getAttribute('aria-label'), classes: b.className.substring(0, 50) }; }))"
    );
    console.log("Sample buttons found:", discovery);
  } catch (e) {
    console.log("Discovery failed:", e.message.substring(0, 100));
  }

  // Scroll to top first
  runJsInSafari("window.scrollTo(0, 0)");
  await setTimeout(1000);

  let enrolled = 0;
  let failed = 0;
  let noButtonRounds = 0;

  // Scroll through the page slowly, clicking "+" buttons as we find them
  console.log("\nScrolling through offers and clicking + buttons...\n");

  while (true) {
    // Try to find and click a "+" button currently visible on screen.
    // The buttons are blue circles with a "+" icon. Try multiple selectors.
    let clicked = false;
    try {
      const result = runJsInSafari(
        `(function() {
          var selectors = [
            'button[aria-label*="Add"]',
            'button[aria-label*="add"]',
            'button[title*="Add"]',
            'button[data-testid*="add"]',
            'button[data-testid*="Add"]'
          ];
          for (var s = 0; s < selectors.length; s++) {
            var btns = document.querySelectorAll(selectors[s]);
            for (var i = 0; i < btns.length; i++) {
              var b = btns[i];
              var rect = b.getBoundingClientRect();
              if (rect.top >= 0 && rect.top < window.innerHeight && !b.disabled) {
                b.scrollIntoView({block: 'center'});
                b.click();
                return 'clicked:' + (b.getAttribute('aria-label') || b.title || 'offer');
              }
            }
          }
          var allBtns = document.querySelectorAll('button');
          for (var j = 0; j < allBtns.length; j++) {
            var btn = allBtns[j];
            var r = btn.getBoundingClientRect();
            var svg = btn.querySelector('svg');
            if (svg && r.top >= 0 && r.top < window.innerHeight && !btn.disabled) {
              var text = (btn.textContent || '').trim();
              if (text === '' || text === '+' || text.length < 3) {
                btn.scrollIntoView({block: 'center'});
                btn.click();
                return 'clicked:svg-button';
              }
            }
          }
          return 'none';
        })()`
      );

      if (result.startsWith("clicked")) {
        clicked = true;
        enrolled++;
        const label = result.split(":")[1] || "offer";
        console.log(`  [${enrolled}] Enrolled: ${label}`);
        noButtonRounds = 0;
        // Wait for enrollment to register
        await setTimeout(2500);
        // Don't scroll yet — there might be more buttons visible
        continue;
      }
    } catch (e) {
      console.log(`  Error checking for buttons: ${e.message.substring(0, 80)}`);
      failed++;
    }

    if (!clicked) {
      noButtonRounds++;

      // Check if we've reached the bottom of the page
      const atBottom = runJsInSafari(
        "(window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 100) ? 'yes' : 'no'"
      );

      if (atBottom === "yes" && noButtonRounds >= 2) {
        console.log("\n  Reached the bottom of the page.");
        break;
      }

      // Scroll down a bit to reveal more offers
      runJsInSafari("window.scrollBy(0, 400)");
      await setTimeout(1500);
    }
  }

  console.log(
    `\nDone! Enrolled in ${enrolled} offer(s). Failed: ${failed}.`
  );
  return { enrolled, failed };
}

module.exports = { enrollOffers };
