const { setTimeout } = require("timers/promises");

const LOGIN_URL =
  "https://www.americanexpress.com/en-us/account/login?DestPage=https://www.americanexpress.com/en-us/travel/";

async function login(page, { username, password }) {
  console.log("Navigating to Amex login page...");
  await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

  // Wait for the login form to appear
  console.log("Waiting for login form...");
  const userField = page.locator("#eliloUserID");
  const passField = page.locator("#eliloPassword");

  await userField.waitFor({ state: "visible", timeout: 30000 });
  await setTimeout(1000);

  // Fill credentials by clicking and typing slowly (like a real person)
  console.log("Entering credentials...");
  await userField.click();
  await setTimeout(300);
  await userField.pressSequentially(username, { delay: 50 });
  await setTimeout(500);

  await passField.click();
  await setTimeout(300);
  await passField.pressSequentially(password, { delay: 50 });
  await setTimeout(1000);

  // Submit the login — try multiple approaches using only Playwright locators
  // (Amex blocks page.evaluate so we cannot use JavaScript clicks)
  console.log("Submitting login...");

  // Try clicking the Log In button by accessible role
  const byRole = page.getByRole("button", { name: "Log In" });
  const byId = page.locator("#loginSubmit");
  const bySubmit = page.locator('button[type="submit"]');
  const byText = page.locator("button", { hasText: "Log In" });

  const candidates = [
    { label: "getByRole('button', 'Log In')", locator: byRole },
    { label: "#loginSubmit", locator: byId },
    { label: "button[type=submit]", locator: bySubmit },
    { label: "button hasText 'Log In'", locator: byText },
  ];

  for (const { label, locator } of candidates) {
    try {
      const count = await locator.count();
      console.log(`  ${label}: found ${count} match(es)`);
      if (count > 0) {
        await locator.first().click({ force: true, timeout: 5000 });
        console.log(`  -> Clicked via ${label}`);
        break;
      }
    } catch (e) {
      console.log(`  -> ${label} failed: ${e.message.substring(0, 80)}`);
    }
  }

  // Also press Enter in the password field as a backup
  await setTimeout(500);
  try {
    await passField.press("Enter");
    console.log("  -> Pressed Enter in password field");
  } catch (e) {
    // passField may no longer be attached if a click already navigated
  }

  // Wait for login to complete — Amex may ask for 2FA verification.
  // Poll for up to 3 minutes so the user has time to complete it manually.
  console.log("\nWaiting for login to complete...");
  console.log("If Amex asks for a verification code, enter it in the browser window.");
  console.log("Waiting up to 3 minutes for you to finish...\n");

  const maxWaitMs = 3 * 60 * 1000;
  const pollInterval = 3000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const currentUrl = page.url();

    if (
      !currentUrl.includes("/account/login") &&
      !currentUrl.includes("/authentication")
    ) {
      console.log("Login successful. Current URL:", currentUrl);
      return;
    }

    await setTimeout(pollInterval);
  }

  const finalUrl = page.url();
  if (finalUrl.includes("/account/login") || finalUrl.includes("/authentication")) {
    throw new Error(
      "Login timed out after 3 minutes. Complete the verification faster next time, or check your credentials."
    );
  }

  console.log("Login successful. Current URL:", finalUrl);
}

module.exports = { login };
