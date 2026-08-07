import { chromium, firefox, webkit } from 'playwright';
import { createLogger } from './logger.js';
import { ensureImageCache, installChallanImageRoutes } from './imageInline.js';

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
  '--disable-web-security',
];

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Prefer Chromium, then Firefox, then WebKit if launch/navigation fails. */
const BROWSER_TYPES = [
  { name: 'chromium', engine: chromium, args: CHROMIUM_ARGS },
  { name: 'firefox', engine: firefox, args: [] },
  { name: 'webkit', engine: webkit, args: [] },
];

const BLOCKED_URL_PATTERNS =
  /google-analytics|googletagmanager|facebook\.net|hotjar|clarity\.ms|doubleclick|\.woff2?(?:\?|$)|fonts\.gstatic\.com/i;

/**
 * Launch a browser engine by name (or first available).
 * When `prefer` is set, only that engine is tried — callers handle fallbacks.
 * @param {{ prefer?: string }} [options]
 */
export async function launchBrowser(options = {}) {
  const preferred = (options.prefer || process.env.PLAYWRIGHT_BROWSER || '').toLowerCase();
  const ordered = preferred
    ? BROWSER_TYPES.filter((b) => b.name === preferred)
    : BROWSER_TYPES;

  if (!ordered.length) {
    throw new Error(`Unknown Playwright browser: ${preferred}`);
  }

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

      await context.route(BLOCKED_URL_PATTERNS, (route) => route.abort());
      await installChallanImageRoutes(context);
      ensureImageCache(context);

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

// ─── Browser pool ────────────────────────────────────────────
// Keep one warm browser to skip launch + navigation on repeat requests.

const POOL_SIZE = parseInt(process.env.BROWSER_POOL_SIZE || '1', 10);
// Shorter max age — Angular captcha/session on pooled print form goes stale fast
const POOL_MAX_AGE_MS = 2 * 60 * 1000;

/** @type {{ browser: any, context: any, page: any, browserName: string, createdAt: number }[]} */
const pool = [];
let warmingUp = false;

/**
 * Take a ready-to-use browser from the pool (already on Download Challan Print form).
 * Returns null if pool is empty.
 */
export function takeFromPool() {
  while (pool.length) {
    const entry = pool.shift();
    if (Date.now() - entry.createdAt > POOL_MAX_AGE_MS) {
      safeClose(entry.browser);
      continue;
    }
    log.step('Using pooled browser', { browser: entry.browserName, age: `${((Date.now() - entry.createdAt) / 1000).toFixed(0)}s` });
    return entry;
  }
  return null;
}

/**
 * Add a pre-navigated browser to the pool for reuse.
 */
export function returnToPool(entry) {
  if (pool.length >= POOL_SIZE) {
    safeClose(entry.browser);
    return;
  }
  entry.createdAt = Date.now();
  pool.push(entry);
}

/**
 * Pre-warm the pool with a browser navigated to the Download Challan Print form.
 * Called after a request finishes so the next request is instant.
 */
export async function warmPool(openFormFn) {
  if (warmingUp || pool.length >= POOL_SIZE) return;
  warmingUp = true;

  try {
    const preferred = process.env.PLAYWRIGHT_BROWSER || 'chromium';
    const launched = await launchBrowser({ prefer: preferred });
    await openFormFn(launched.page);
    returnToPool({
      browser: launched.browser,
      context: launched.context,
      page: launched.page,
      browserName: launched.browserName,
      createdAt: Date.now(),
    });
    log.step('Pool warmed', { browser: launched.browserName });
  } catch (err) {
    log.warn('Pool warm failed', err?.message || err);
  } finally {
    warmingUp = false;
  }
}

export async function safeClose(browser) {
  if (!browser) return;
  try {
    await browser.close();
  } catch (err) {
    log.warn('Browser close failed', err.message);
  }
}
