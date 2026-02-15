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
  // Using fill() is too fast and Amex's JS doesn't register the values
  console.log("Entering credentials...");
  await userField.click();
  await setTimeout(300);
  await userField.pressSequentially(username, { delay: 50 });
  await setTimeout(500);

  await passField.click();
  await setTimeout(300);
  await passField.pressSequentially(password, { delay: 50 });
  await setTimeout(500);

  // Submit the login form — try every method until one works
  console.log("Submitting login...");

  // Debug: log all buttons found on the page
  const allButtons = await page.evaluate(() => {
    const btns = document.querySelectorAll("button, input[type=submit]");
    return Array.from(btns).map((b) => ({
      tag: b.tagName,
      id: b.id,
      type: b.type,
      text: b.textContent?.trim().substring(0, 40),
      className: b.className?.substring(0, 60),
    }));
  });
  console.log("Buttons found on page:", JSON.stringify(allButtons, null, 2));

  // Method 1: Force-click with Playwright (bypasses overlay checks)
  try {
    const loginBtn = page.locator(
      '#loginSubmit, button:has-text("Log In"), button[type="submit"]'
    ).first();
    await loginBtn.click({ force: true, timeout: 5000 });
    console.log("  -> Playwright force-click done");
  } catch (e) {
    console.log("  -> Playwright force-click failed:", e.message);
  }
  await setTimeout(2000);

  // Method 2: Click via raw JavaScript (most reliable)
  await page.evaluate(() => {
    const btn =
      document.querySelector("#loginSubmit") ||
      document.querySelector('button[type="submit"]') ||
      Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Log In")
      );
    if (btn) {
      btn.click();
      console.log("JS click on:", btn.id || btn.textContent);
    }
  });
  console.log("  -> JavaScript click done");
  await setTimeout(2000);

  // Method 3: Submit the form directly
  await page.evaluate(() => {
    const form = document.querySelector("form");
    if (form) form.submit();
  });
  console.log("  -> Form submit done");

  // Wait for login to complete — Amex may ask for 2FA verification.
  // Poll for up to 3 minutes so the user has time to complete it manually.
  console.log("Waiting for login to complete...");
  console.log("If Amex asks for a verification code, enter it in the browser window.");
  console.log("Waiting up to 3 minutes for you to finish...\n");

  const maxWaitMs = 3 * 60 * 1000; // 3 minutes
  const pollInterval = 3000; // check every 3 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const currentUrl = page.url();

    // Success: we've left the login page
    if (
      !currentUrl.includes("/account/login") &&
      !currentUrl.includes("/authentication")
    ) {
      console.log("Login successful. Current URL:", currentUrl);
      return;
    }

    await setTimeout(pollInterval);
  }

  // Final check after timeout
  const finalUrl = page.url();
  if (finalUrl.includes("/account/login") || finalUrl.includes("/authentication")) {
    throw new Error(
      "Login timed out after 3 minutes. Complete the verification faster next time, or check your credentials."
    );
  }

  console.log("Login successful. Current URL:", finalUrl);
}

module.exports = { login };
