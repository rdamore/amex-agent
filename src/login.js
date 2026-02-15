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

  // Fill credentials
  console.log("Entering credentials...");
  await userField.fill(username);
  await passField.fill(password);

  // Click the login button
  const loginButton = page.locator("#loginSubmit");
  await loginButton.click();

  // Wait for navigation after login
  console.log("Waiting for login to complete...");
  await page.waitForURL("**/travel/**", { timeout: 60000 }).catch(() => {
    // Login may redirect elsewhere; just wait for network to settle
  });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});

  // Verify login succeeded by checking we're no longer on the login page
  const currentUrl = page.url();
  if (currentUrl.includes("/account/login")) {
    throw new Error(
      "Login appears to have failed — still on the login page. Check your credentials."
    );
  }

  console.log("Login successful. Current URL:", currentUrl);
}

module.exports = { login };
