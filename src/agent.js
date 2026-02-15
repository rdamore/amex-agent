const { openInSafari, waitForLogin } = require("./safari");
const { enrollOffers } = require("./enroll-offers");

const LOGIN_URL =
  "https://www.americanexpress.com/en-us/account/login?DestPage=https://www.americanexpress.com/en-us/travel/";

async function runAgent() {
  console.log(`\n========================================`);
  console.log(`Amex Offer Enrollment Agent`);
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`========================================\n`);

  // Step 1: Open login page in real Safari and wait for user to log in
  openInSafari(LOGIN_URL);
  await waitForLogin();

  // Step 2 & 3: Navigate to offers and enroll
  const result = await enrollOffers();

  console.log(`\nAgent finished at: ${new Date().toISOString()}`);
  return result;
}

module.exports = { runAgent };
