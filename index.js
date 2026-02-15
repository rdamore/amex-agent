require("dotenv").config();
const cron = require("node-cron");
const { runAgent } = require("./src/agent");

const mode = process.argv[2]; // "once" or "cron"

async function main() {
  if (mode === "cron") {
    const schedule = process.env.CRON_SCHEDULE || "0 8 * * *";
    console.log(`Scheduling agent to run on cron: ${schedule}`);
    console.log("(default: daily at 8:00 AM)\n");

    cron.schedule(schedule, async () => {
      try {
        await runAgent();
      } catch (err) {
        console.error("Agent run failed:", err.message);
      }
    });

    // Keep the process alive
    console.log("Cron scheduler is running. Press Ctrl+C to stop.");
  } else {
    // Default: run once immediately
    try {
      await runAgent();
      process.exit(0);
    } catch (err) {
      console.error("Agent run failed:", err.message);
      process.exit(1);
    }
  }
}

main();
