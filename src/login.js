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

  // Tab through the form like a real person would:
  // Click username -> type -> Tab to password -> type -> Tab to button -> Enter
  console.log("Entering credentials...");
  await userField.click();
  await setTimeout(300);
  await page.keyboard.type(username, { delay: 50 });
  await setTimeout(300);

  await page.keyboard.press("Tab");
  await setTimeout(300);
  await page.keyboard.type(password, { delay: 50 });
  await setTimeout(500);

  // Tab from password to the Log In button, then press Enter
  console.log("Submitting login...");
  await page.keyboard.press("Tab");
  await setTimeout(300);
  await page.keyboard.press("Enter");
  console.log("  -> Pressed Enter after Tab to submit button");

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
