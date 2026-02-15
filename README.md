# Amex Offer Enrollment Agent

Automatically logs into your American Express account and enrolls in all available Amex Offers.

## Setup

```bash
npm install
npm run setup   # downloads Chromium for Playwright
```

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Edit `.env` and add your Amex credentials:

```
AMEX_USERNAME=your_username
AMEX_PASSWORD=your_password
```

## Usage

### Run once

```bash
npm start
```

### Run on a daily schedule (cron)

```bash
npm run cron
```

By default this runs daily at 8:00 AM. Change the schedule in `.env`:

```
CRON_SCHEDULE=0 8 * * *
```

### Debug mode (visible browser)

Set `HEADLESS=false` in `.env` to watch the browser as it runs.

## How it works

1. Opens the Amex login page and signs in with your credentials
2. Navigates to the Amex Offers page
3. Scrolls through all offers and clicks "Add to Card" on every unenrolled offer
4. Logs results and saves a screenshot on failure to `screenshots/`

## Notes

- Amex may prompt for 2FA on first login from a new machine. Run with `HEADLESS=false` the first time so you can complete any verification steps manually.
- The selectors used to find offer buttons may need updating if Amex changes their UI. Check the `src/enroll-offers.js` file to adjust selectors.
