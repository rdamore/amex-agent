const { execSync } = require("child_process");
const { setTimeout } = require("timers/promises");

function osascript(script) {
  return execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
    encoding: "utf-8",
    timeout: 15000,
  }).trim();
}

function openInSafari(url) {
  execSync(`open -a Safari "${url}"`);
}

function getSafariUrl() {
  return osascript('tell application "Safari" to get URL of current tab of front window');
}

function runJsInSafari(js) {
  // AppleScript's "do JavaScript" bypasses CSP restrictions
  const escaped = js.replace(/\\/g, "\\\\").replace(/'/g, "'\\''").replace(/"/g, '\\"');
  return osascript(
    `tell application "Safari" to do JavaScript "${escaped}" in current tab of front window`
  );
}

async function waitForLogin(maxMinutes = 5) {
  console.log("\n============================================");
  console.log("  Please log in manually in Safari.");
  console.log("  The agent will take over once you're in.");
  console.log("============================================\n");

  const maxWaitMs = maxMinutes * 60 * 1000;
  const pollInterval = 2000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const url = getSafariUrl();
      if (
        !url.includes("/account/login") &&
        !url.includes("/authentication") &&
        url.includes("americanexpress.com")
      ) {
        console.log("Login detected! URL:", url);
        return;
      }
    } catch (e) {
      // Safari might not be ready yet
    }
    await setTimeout(pollInterval);
  }

  throw new Error("Login timed out.");
}

module.exports = { openInSafari, getSafariUrl, runJsInSafari, waitForLogin };
