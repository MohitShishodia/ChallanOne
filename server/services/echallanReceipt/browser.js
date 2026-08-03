import { chromium } from 'playwright';
import { createLogger } from './logger.js';

const log = createLogger();

const DEFAULT_LAUNCH_OPTIONS = {
  headless: true,
  args: [
    '--disable-blink-features=AutomationControlled',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-default-apps',
    '--mute-audio',
  ],
};

/**
 * Launch Chromium with a fresh context.
 * Caller must close browser in finally.
 */
export async function launchBrowser(options = {}) {
  log.step('Opening Portal... launching Chromium');
  const browser = await chromium.launch({
    ...DEFAULT_LAUNCH_OPTIONS,
    ...options,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    acceptDownloads: true,
    javaScriptEnabled: true,
    ignoreHTTPSErrors: true,
    serviceWorkers: 'block',
  });

  // Speed: block analytics only — keep fonts/images so receipt PDFs render correctly
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
  // VPS → Indian government portal can be slow
  page.setDefaultTimeout(45000);
  page.setDefaultNavigationTimeout(60000);

  return { browser, context, page };
}

export async function safeClose(browser) {
  if (!browser) return;
  try {
    await browser.close();
  } catch (err) {
    log.warn('Browser close failed', err.message);
  }
}
