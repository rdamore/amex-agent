const { setTimeout } = require("timers/promises");

const LOGIN_URL =
  "https://www.americanexpress.com/en-us/account/login?DestPage=https://www.americanexpress.com/en-us/travel/";

async function login(page) {
  console.log("Opening Amex login page...");
  await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

  console.log("\n============================================");
  console.log("  Please log in manually in the browser.");
  console.log("  The agent will take over once you're in.");
  console.log("============================================\n");

  // Poll until the user has logged in (URL leaves the login/auth pages)
  const maxWaitMs = 5 * 60 * 1000; // 5 minutes to log in
  const pollInterval = 2000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const currentUrl = page.url();

    if (
      !currentUrl.includes("/account/login") &&
      !currentUrl.includes("/authentication")
    ) {
      console.log("Login detected! Current URL:", currentUrl);
      return;
    }

    await setTimeout(pollInterval);
  }

  throw new Error("Login timed out after 5 minutes.");
}

module.exports = { login };
