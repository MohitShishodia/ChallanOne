import { chromium, firefox, webkit } from 'playwright';
import { createLogger } from './logger.js';

const log = createLogger();

const CHROMIUM_ARGS = [
  '--disable-blink-features=AutomationControlled',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-extensions',
  '--disable-background-networking',
  '--disable-default-apps',
  '--mute-audio',
];

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Prefer Chromium, then Firefox, then WebKit if launch/navigation fails. */
const BROWSER_TYPES = [
  { name: 'chromium', engine: chromium, args: CHROMIUM_ARGS },
  { name: 'firefox', engine: firefox, args: [] },
  { name: 'webkit', engine: webkit, args: [] },
];

/**
 * Launch a browser engine by name (or first available).
 * @param {{ prefer?: string }} [options]
 */
export async function launchBrowser(options = {}) {
  const preferred = (options.prefer || process.env.PLAYWRIGHT_BROWSER || 'chromium').toLowerCase();
  const ordered = [
    ...BROWSER_TYPES.filter((b) => b.name === preferred),
    ...BROWSER_TYPES.filter((b) => b.name !== preferred),
  ];

  let lastError;
  for (const candidate of ordered) {
    try {
      log.step(`Opening Portal... launching ${candidate.name}`);
      const launchOpts = { headless: true };
      if (candidate.args.length) launchOpts.args = candidate.args;

      const browser = await candidate.engine.launch(launchOpts);
      const context = await browser.newContext({
        viewport: { width: 1366, height: 850 },
        userAgent: USER_AGENT,
        acceptDownloads: true,
        javaScriptEnabled: true,
        ignoreHTTPSErrors: true,
        serviceWorkers: 'block',
      });

      await context.route('**/*', (route) => {
        const url = route.request().url();
        if (
          /google-analytics|googletagmanager|facebook|hotjar|clarity\.ms|doubleclick/i.test(url)
        ) {
          return route.abort();
        }
        return route.continue();
      });

      await context.addInitScript(() => {
        window.print = () => {};
      });

      const page = await context.newPage();
      page.setDefaultTimeout(45000);
      page.setDefaultNavigationTimeout(90000);

      return { browser, context, page, browserName: candidate.name };
    } catch (err) {
      lastError = err;
      log.warn(`Failed to launch ${candidate.name}`, err?.message || err);
    }
  }

  throw lastError || new Error('Unable to launch any Playwright browser');
}

export async function safeClose(browser) {
  if (!browser) return;
  try {
    await browser.close();
  } catch (err) {
    log.warn('Browser close failed', err.message);
  }
}
