import { chromium } from 'playwright';
import { createLogger } from './logger.js';

const log = createLogger();

const DEFAULT_LAUNCH_OPTIONS = {
  headless: true,
  args: [
    '--disable-blink-features=AutomationControlled',
    '--no-sandbox',
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
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    acceptDownloads: true,
    javaScriptEnabled: true,
    ignoreHTTPSErrors: true,
    // Skip loading large extras — captcha is usually a data:image URL
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

  // Avoid native print dialog
  await context.addInitScript(() => {
    window.print = () => {};
  });

  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(30000);

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
