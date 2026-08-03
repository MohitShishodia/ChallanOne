import { launchBrowser, safeClose } from './browser.js';
import { PORTAL, SELECTORS, ERROR_PATTERNS } from './selectors.js';
import { createLogger } from './logger.js';
import { ReceiptError, ERROR_CODES } from './errors.js';
import { createSession, takeSession, updateSessionCaptcha, getSession } from './sessionStore.js';
import { captureReceipt, saveDownload } from './receiptCapture.js';

const log = createLogger();

/**
 * Open Download Challan Print and return captcha image + sessionId.
 * Retries across browsers (chromium → firefox → webkit).
 */
export async function startCaptchaSession() {
  const browsers = ['chromium', 'firefox', 'webkit'];
  let lastError;

  for (let i = 0; i < browsers.length; i++) {
    const prefer = browsers[i];
    let browser;
    try {
      log.step(`Captcha session attempt ${i + 1}/${browsers.length} (${prefer})`);
      const launched = await launchBrowser({ prefer });
      browser = launched.browser;
      const { page } = launched;

      await openDownloadChallanPrint(page);
      const captchaImage = await readCaptchaImage(page);
      const sessionId = createSession({ browser, context: launched.context, page, captchaImage });

      log.step('Captcha session ready', { sessionId, browser: launched.browserName });
      return { sessionId, captchaImage };
    } catch (err) {
      lastError = err;
      log.warn(`Captcha session attempt with ${prefer} failed`, err?.message || err);
      await safeClose(browser);
    }
  }

  throw mapAutomationError(lastError);
}

/**
 * Refresh captcha for an existing session.
 */
export async function refreshCaptchaSession(sessionId) {
  const session = getSession(sessionId);
  if (!session) {
    throw new ReceiptError(ERROR_CODES.VALIDATION, 'Session expired. Please try again.', { status: 410 });
  }

  try {
    log.step('Refreshing captcha...');
    const refresh = session.page.locator(SELECTORS.captchaRefresh).first();
    await refresh.click({ timeout: 8000 });

    // Wait for captcha image src to change / reappear
    await session.page
      .locator(SELECTORS.captchaImage)
      .first()
      .waitFor({ state: 'visible', timeout: 8000 });

    const captchaImage = await readCaptchaImage(session.page);
    updateSessionCaptcha(sessionId, captchaImage);
    return { sessionId, captchaImage };
  } catch (err) {
    throw mapAutomationError(err);
  }
}

/**
 * Fill form, get details, click Print, capture receipt PDF.
 * @param {{ challanNumber: string, captcha: string, sessionId: string }} params
 */
export async function fetchChallanReceipt({ challanNumber, captcha, sessionId }) {
  if (!challanNumber?.trim()) {
    throw new ReceiptError(ERROR_CODES.VALIDATION, 'Challan number is required.');
  }
  if (!captcha?.trim()) {
    throw new ReceiptError(ERROR_CODES.VALIDATION, 'Captcha is required.');
  }
  if (!sessionId) {
    throw new ReceiptError(ERROR_CODES.VALIDATION, 'Session expired. Please try again.', { status: 410 });
  }

  const session = takeSession(sessionId);
  if (!session) {
    throw new ReceiptError(ERROR_CODES.VALIDATION, 'Session expired. Please try again.', { status: 410 });
  }

  const { browser, context, page } = session;

  try {
    log.step('Submitting Form...', { challanNumber: challanNumber.trim() });

    await ensureOnDownloadForm(page);
    await selectChallanSearchType(page);
    await fillChallanNumber(page, challanNumber.trim());
    await fillCaptcha(page, captcha.trim());

    await clickGetDetails(page);
    log.step('Waiting for Result...');

    await waitForResultsOrError(page);

    log.step('Receipt Found... clicking Print');

    const popupPromise = context.waitForEvent('page', { timeout: 30000 }).catch(() => null);
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 }).catch(() => null);

    const printClicked = await clickPrint(page);
    if (!printClicked) {
      throw new ReceiptError(
        ERROR_CODES.SITE_CHANGED,
        'Could not find the print option for this challan.'
      );
    }

    const firstEvent = await Promise.race([
      downloadPromise.then((download) => (download ? { type: 'download', download } : null)),
      popupPromise.then((popup) => (popup ? { type: 'popup', popup } : null)),
    ]);

    if (firstEvent?.type === 'download') {
      return await saveDownload(firstEvent.download, challanNumber.trim());
    }

    if (firstEvent?.type === 'popup') {
      log.step('Opening Receipt... (new tab)');
      if (firstEvent.popup.url().startsWith('chrome://')) {
        throw new ReceiptError(ERROR_CODES.SITE_CHANGED, 'Unable to capture receipt. Please try again.');
      }
      return await captureReceipt(firstEvent.popup, challanNumber.trim());
    }

    const latePopup = await popupPromise;
    if (latePopup && !latePopup.url().startsWith('chrome://')) {
      return await captureReceipt(latePopup, challanNumber.trim());
    }
    const lateDownload = await downloadPromise;
    if (lateDownload) {
      return await saveDownload(lateDownload, challanNumber.trim());
    }

    log.step('Opening Receipt... (same page)');
    return await captureReceipt(page, challanNumber.trim());
  } catch (err) {
    throw mapAutomationError(err);
  } finally {
    await safeClose(browser);
  }
}

async function openDownloadChallanPrint(page) {
  const urls = PORTAL.servicesUrlFallbacks?.length
    ? PORTAL.servicesUrlFallbacks
    : [PORTAL.servicesUrl];

  let lastError;
  let opened = false;

  for (const url of urls) {
    try {
      log.step('Opening Portal...', url);
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 90000,
      });

      if (!response || response.status() >= 500) {
        throw new Error(`Portal returned status ${response?.status()}`);
      }
      opened = true;
      break;
    } catch (err) {
      lastError = err;
      log.warn(`Portal navigation failed for ${url}`, err?.message || err);
    }
  }

  if (!opened) {
    throw lastError || new ReceiptError(ERROR_CODES.PORTAL_DOWN, 'Receipt service is temporarily unavailable.');
  }

  // Already on download form?
  const formReady = await page
    .locator(SELECTORS.challanNumberInput)
    .first()
    .isVisible()
    .catch(() => false);

  if (!formReady) {
    log.step('Navigating... Download Challan Print');
    const tile = page.locator(SELECTORS.downloadChallanPrintTile).first();
    const hasTile = await tile.count().catch(() => 0);
    if (hasTile) {
      await tile.waitFor({ state: 'visible', timeout: 30000 });
      await Promise.all([
        page.locator(SELECTORS.challanNumberInput).first().waitFor({ state: 'visible', timeout: 30000 }),
        tile.click(),
      ]);
    } else {
      const textLink = page.locator(SELECTORS.downloadChallanPrintText).first();
      if (await textLink.count()) {
        await Promise.all([
          page.locator(SELECTORS.challanNumberInput).first().waitFor({ state: 'visible', timeout: 30000 }),
          textLink.click(),
        ]);
      } else {
        // Last resort: go to challan route
        await page.goto(PORTAL.challanUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
        await page.locator(SELECTORS.challanNumberInput).first().waitFor({ state: 'visible', timeout: 30000 });
      }
    }
  }

  await page.locator(SELECTORS.captchaImage).first().waitFor({ state: 'visible', timeout: 30000 });
  log.step('Download Challan Print form ready');
}

async function ensureOnDownloadForm(page) {
  const input = page.locator(SELECTORS.challanNumberInput).first();
  if (await input.isVisible().catch(() => false)) return;

  log.warn('Form not present — reopening Download Challan Print');
  await openDownloadChallanPrint(page);
}

async function selectChallanSearchType(page) {
  const radio = page.locator(SELECTORS.searchTypeChallan).first();
  if (await radio.count()) {
    const checked = await radio.isChecked().catch(() => false);
    if (!checked) {
      await radio.check({ force: true }).catch(async () => {
        await radio.click({ force: true });
      });
    }
  }
}

async function fillChallanNumber(page, challanNumber) {
  const input = page.locator(SELECTORS.challanNumberInput).first();
  await input.waitFor({ state: 'visible', timeout: 10000 });
  await input.fill(challanNumber);
}

async function fillCaptcha(page, captcha) {
  const input = page.locator(SELECTORS.captchaInput).first();
  await input.waitFor({ state: 'visible', timeout: 10000 });
  await input.fill(captcha);
}

async function clickGetDetails(page) {
  const btn = page.locator(SELECTORS.getDetailsButton).first();
  await btn.waitFor({ state: 'visible', timeout: 8000 });

  // Angular enables the button after form validity updates
  await page
    .waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        return el && !el.disabled && !el.classList.contains('disabled');
      },
      'button.get-details-btn',
      { timeout: 4000 }
    )
    .catch(() => {});

  await btn.click({ force: true });
}

async function readCaptchaImage(page) {
  const img = page.locator(SELECTORS.captchaImage).first();
  await img.waitFor({ state: 'visible', timeout: 10000 });

  const src = await img.getAttribute('src');
  if (src?.startsWith('data:image')) {
    return src;
  }

  const buffer = await img.screenshot({ type: 'png' });
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

/**
 * Race results vs error UI — no fixed sleep.
 */
async function waitForResultsOrError(page) {
  const resultLocator = page.locator(SELECTORS.resultsTable).first();
  const swalLocator = page.locator('.swal2-container, .swal2-popup').first();
  const alertLocator = page.locator(SELECTORS.alertMessage).first();

  const outcome = await Promise.race([
    resultLocator.waitFor({ state: 'visible', timeout: 45000 }).then(() => 'results'),
    swalLocator.waitFor({ state: 'visible', timeout: 45000 }).then(() => 'swal'),
    alertLocator.waitFor({ state: 'visible', timeout: 45000 }).then(() => 'alert'),
  ]).catch(() => null);

  if (outcome === 'results') {
    // Still check if an error toast appeared alongside empty UI
    await throwIfPortalError(page);
    return;
  }

  await throwIfPortalError(page);

  // One more quick check for delayed results
  const appeared = await resultLocator.isVisible().catch(() => false);
  if (appeared) return;

  throw new ReceiptError(
    ERROR_CODES.NOT_FOUND,
    'Challan not found. Please check the challan number or captcha.'
  );
}

async function throwIfPortalError(page) {
  const swalVisible = await page.locator('.swal2-container').isVisible().catch(() => false);
  let combined = '';

  if (swalVisible) {
    combined = (
      await page.locator('.swal2-html-container, .swal2-content, .swal2-title').allInnerTexts()
    ).join(' ');
  }

  if (!combined.trim()) {
    const alertText = (await page.locator(SELECTORS.alertMessage).first().innerText().catch(() => '')) || '';
    combined = alertText;
  }

  // Lightweight body scan only when we already saw an alert/swal
  if (!combined.trim()) return;

  if (ERROR_PATTERNS.invalidCaptcha.test(combined)) {
    throw new ReceiptError(ERROR_CODES.INVALID_CAPTCHA, 'Invalid captcha');
  }
  if (ERROR_PATTERNS.invalidChallan.test(combined)) {
    throw new ReceiptError(ERROR_CODES.INVALID_CHALLAN, 'Invalid challan number');
  }
  if (ERROR_PATTERNS.notFound.test(combined) || /not found/i.test(combined)) {
    throw new ReceiptError(ERROR_CODES.NOT_FOUND, 'Challan not found');
  }
  if (ERROR_PATTERNS.portalDown.test(combined)) {
    throw new ReceiptError(ERROR_CODES.PORTAL_DOWN, 'Receipt service is temporarily unavailable');
  }
  if (combined.trim()) {
    throw new ReceiptError(ERROR_CODES.INTERNAL, combined.trim().slice(0, 200));
  }
}

async function clickPrint(page) {
  const candidates = [
    page.locator('a[title*="Print" i]').first(),
    page.locator('button[title*="Print" i]').first(),
    page.locator('img[alt*="Print" i]').first(),
    page.locator('i.fa-print').first(),
    page.getByRole('button', { name: /print/i }).first(),
    page.getByRole('link', { name: /print/i }).first(),
    page.locator(SELECTORS.printButton).first(),
    page.locator('.mobile-challan-card a, .mobile-challan-card button').first(),
  ];

  for (const loc of candidates) {
    if (!(await loc.count())) continue;
    if (!(await loc.isVisible().catch(() => false))) continue;
    await loc.click({ timeout: 6000 });
    return true;
  }

  return page.evaluate(() => {
    const root =
      document.querySelector('table, .mobile-challan-list, .mobile-challan-card') || document.body;
    const el = [...root.querySelectorAll('a,button,img,i,span')].find((node) => {
      const hay =
        `${node.getAttribute('title') || ''} ${node.getAttribute('alt') || ''} ${node.getAttribute('aria-label') || ''} ${node.textContent || ''}`.toLowerCase();
      return hay.includes('print') || hay.includes('receipt') || hay.includes('download');
    });
    if (!el) return false;
    el.click();
    return true;
  });
}

function mapAutomationError(err) {
  if (err instanceof ReceiptError) return err;

  const message = err?.message || String(err);

  if (/timeout/i.test(message)) {
    return new ReceiptError(ERROR_CODES.TIMEOUT, 'Request timed out. Please try again.', {
      details: message,
    });
  }
  if (/net::|ERR_|ECONNREFUSED|ENOTFOUND|navigat/i.test(message)) {
    return new ReceiptError(ERROR_CODES.PORTAL_DOWN, 'Receipt service is temporarily unavailable.', {
      details: message,
    });
  }
  if (/strict mode violation|selector|waiting for/i.test(message)) {
    return new ReceiptError(ERROR_CODES.SITE_CHANGED, 'Unable to fetch receipt right now. Please try again.', {
      details: message,
    });
  }

  return new ReceiptError(ERROR_CODES.INTERNAL, message.slice(0, 240) || 'Unable to fetch challan receipt.');
}
