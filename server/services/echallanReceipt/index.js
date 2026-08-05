import { launchBrowser, safeClose, takeFromPool, warmPool } from './browser.js';
import { PORTAL, SELECTORS, ERROR_PATTERNS } from './selectors.js';
import { createLogger } from './logger.js';
import { ReceiptError, ERROR_CODES } from './errors.js';
import { createSession, takeSession, updateSessionCaptcha, getSession } from './sessionStore.js';
import { captureReceipt, saveDownload } from './receiptCapture.js';
import { ensureImageCache, installChallanImageRoutes } from './imageInline.js';
import { isTwoCaptchaConfigured, solveImageCaptcha, reportIncorrect } from '../twoCaptcha.js';

const log = createLogger();

function schedulePoolWarm() {
  setTimeout(() => warmPool((page) => openPortalServiceForm(page, 'challanPrint')).catch(() => {}), 500);
}

function normalizeDocumentType(value) {
  return value === 'paymentReceipt' ? 'paymentReceipt' : 'challanPrint';
}

/**
 * Open Download Challan Print and return captcha image + sessionId.
 * Retries across browsers (chromium → firefox → webkit).
 * When TWOCAPTCHA_API_KEY is set, also auto-solves the captcha.
 */
export async function startCaptchaSession(documentType = 'challanPrint') {
  const docType = normalizeDocumentType(documentType);
  const browsers = ['chromium', 'firefox'];
  let lastError;

  for (let i = 0; i < browsers.length; i++) {
    const prefer = browsers[i];
    let browser;
    try {
      log.step(`Captcha session attempt ${i + 1}/${browsers.length} (${prefer})`);
      const launched = await launchBrowser({ prefer });
      browser = launched.browser;
      const { page } = launched;

      await openPortalServiceForm(page, docType);
      const captchaImage = await readCaptchaImage(page);
      const solved = await trySolveCaptcha(captchaImage);
      const sessionId = createSession({
        browser,
        context: launched.context,
        page,
        captchaImage,
        browserName: launched.browserName,
        solvedCaptcha: solved.text,
        captchaTaskId: solved.taskId,
        documentType: docType,
      });

      log.step('Captcha session ready', {
        sessionId,
        browser: launched.browserName,
        autoSolved: Boolean(solved.text),
      });
      return {
        sessionId,
        captchaImage,
        solvedCaptcha: solved.text,
        captchaAutoSolved: Boolean(solved.text),
      };
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
    const solved = await trySolveCaptcha(captchaImage);
    updateSessionCaptcha(sessionId, captchaImage, {
      solvedCaptcha: solved.text,
      captchaTaskId: solved.taskId,
    });
    return {
      sessionId,
      captchaImage,
      solvedCaptcha: solved.text,
      captchaAutoSolved: Boolean(solved.text),
    };
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

  const { browser, context, page, browserName, captchaTaskId, documentType } = session;

  try {
    return await submitAndCaptureReceipt({
      page,
      context,
      browserName,
      challanNumber: challanNumber.trim(),
      captcha: captcha.trim(),
      documentType: normalizeDocumentType(documentType),
    });
  } catch (err) {
    const mapped = mapAutomationError(err);
    if (mapped.code === ERROR_CODES.INVALID_CAPTCHA && captchaTaskId != null) {
      await reportIncorrect(captchaTaskId);
    }
    throw mapped;
  } finally {
    await safeClose(browser);
  }
}


/**
 * Fully automatic receipt fetch: open portal → 2Captcha → submit → PDF.
 * On captcha solve failure, keeps a Playwright session open for manual fallback.
 *
 * @param {string} challanNumber
 * @returns {Promise<
 *   | { needsCaptcha: false, receiptUrl: string, filename: string, contentType: string }
 *   | { needsCaptcha: true, sessionId: string, captchaImage: string, message?: string }
 * >}
 */
export async function autoFetchChallanReceipt(challanNumber, options = {}) {
  if (!challanNumber?.trim()) {
    throw new ReceiptError(ERROR_CODES.VALIDATION, 'Challan number is required.');
  }

  log.startTimer();
  const trimmed = challanNumber.trim();
  const documentType = normalizeDocumentType(options.documentType);

  if (!isTwoCaptchaConfigured()) {
    const session = await startCaptchaSession(documentType);
    return {
      needsCaptcha: true,
      sessionId: session.sessionId,
      captchaImage: session.captchaImage,
      message: 'Please enter the captcha to continue.',
    };
  }

  let browser;
  let context;
  let page;
  let browserName;

  try {
    const pooled = documentType === 'challanPrint' ? takeFromPool() : null;
    if (pooled) {
      browser = pooled.browser;
      context = pooled.context;
      page = pooled.page;
      browserName = pooled.browserName;
      log.step('Auto receipt (pooled browser)', { challanNumber: trimmed, browser: browserName, documentType });
    } else {
      log.step('Auto receipt starting (chromium)', { challanNumber: trimmed, documentType });
      const launched = await launchBrowser({ prefer: 'chromium' });
      browser = launched.browser;
      context = launched.context;
      page = launched.page;
      browserName = launched.browserName;
      await openPortalServiceForm(page, documentType);
    }

    await ensureOnDownloadForm(page, documentType);
    await selectChallanSearchType(page);
    await fillChallanNumber(page, trimmed);

    // Fresh captcha after form settle — avoids solving a stale/regenerated image
    await refreshCaptchaOnPage(page).catch(() => {});

    const AUTO_ATTEMPTS = 3;

    for (let attempt = 1; attempt <= AUTO_ATTEMPTS; attempt++) {
      const captchaMeta = await readCaptchaImageWithId(page);
      const solved = await trySolveCaptcha(captchaMeta.dataUrl);

      if (!solved.text) {
        break;
      }

      // If captcha refreshed while we waited for 2Captcha, discard this solve
      const stillSame = await isSameCaptcha(page, captchaMeta.id);
      if (!stillSame) {
        log.warn(`Captcha changed during solve (attempt ${attempt}) — re-solving`);
        if (solved.taskId != null) await reportIncorrect(solved.taskId);
        continue;
      }

      try {
        log.step(`Submitting with auto-solved captcha (attempt ${attempt}/${AUTO_ATTEMPTS})`, {
          text: solved.text,
          length: solved.text.length,
        });
        await fillCaptcha(page, solved.text);
        await clickGetDetails(page);
        log.step('Waiting for Result...');
        await waitForResultsOrError(page);

        const result = await captureReceiptFromResults({
          page,
          context,
          browserName,
          challanNumber: trimmed,
          documentType,
        });
        await safeClose(browser);
        browser = null;
        schedulePoolWarm();
        return { needsCaptcha: false, ...result };
      } catch (err) {
        const mapped = mapAutomationError(err);
        if (mapped.code === ERROR_CODES.INVALID_CAPTCHA) {
          if (solved.taskId != null) await reportIncorrect(solved.taskId);
          log.warn(`Auto captcha rejected by portal (attempt ${attempt})`);

          if (attempt < AUTO_ATTEMPTS) {
            await dismissPortalOverlays(page).catch(() => {});
            // Stay on form — refresh captcha only (no full portal reopen)
            const stillOnForm = await page.locator(SELECTORS.captchaImage).first().isVisible().catch(() => false);
            if (stillOnForm) {
              await refreshCaptchaOnPage(page).catch(() => {});
            } else {
              await openPortalServiceForm(page, documentType);
              await selectChallanSearchType(page);
              await fillChallanNumber(page, trimmed);
            }
            continue;
          }
          break;
        }
        throw mapped;
      }
    }

    // Fall back to manual captcha
    log.warn('Auto captcha failed — falling back to manual captcha');
    await dismissPortalOverlays(page).catch(() => {});
    const onForm = await page.locator(SELECTORS.captchaImage).first().isVisible().catch(() => false);
    if (!onForm) {
      await openPortalServiceForm(page, documentType);
      await selectChallanSearchType(page);
      await fillChallanNumber(page, trimmed);
    } else {
      await refreshCaptchaOnPage(page).catch(() => {});
    }
    const fallbackImage = await readCaptchaImage(page);
    const sessionId = createSession({
      browser,
      context,
      page,
      captchaImage: fallbackImage,
      browserName,
      documentType,
    });
    browser = null;
    return {
      needsCaptcha: true,
      sessionId,
      captchaImage: fallbackImage,
      message: 'Automatic captcha solve failed. Please enter the captcha.',
    };
  } catch (err) {
    await safeClose(browser);
    browser = null;
    throw mapAutomationError(err);
  }
}

/**
 * Submit filled form and capture the receipt PDF. Does not close the browser.
 * Used by manual captcha fallback path.
 */
async function submitAndCaptureReceipt({ page, context, browserName, challanNumber, captcha, documentType = 'challanPrint' }) {
  log.step('Submitting Form...', { challanNumber, browser: browserName, documentType });

  await ensureOnDownloadForm(page, documentType);
  await selectChallanSearchType(page);
  await fillChallanNumber(page, challanNumber);
  await fillCaptcha(page, captcha);

  await clickGetDetails(page);
  log.step('Waiting for Result...');

  await waitForResultsOrError(page);

  return captureReceiptFromResults({ page, context, browserName, challanNumber, documentType });
}

/**
 * After results are visible, click Print and capture the receipt PDF.
 */
async function captureReceiptFromResults({ page, context, browserName, challanNumber, documentType = 'challanPrint' }) {
  log.step(documentType === 'paymentReceipt' ? 'Receipt Found... clicking Payment Receipt' : 'Challan Found... clicking Print');

  // Drop analytics blocking, then retry evidence photos across .gov.in / .nic.in
  await context.unrouteAll().catch(() => {});
  await installChallanImageRoutes(context);
  ensureImageCache(context);

  const popupPromise = context.waitForEvent('page', { timeout: 30000 }).catch(() => null);
  const downloadPromise = page.waitForEvent('download', { timeout: 30000 }).catch(() => null);

  const printClicked = await clickResultDocument(page, documentType);
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

  const captureOpts = { browserName };

  if (firstEvent?.type === 'download') {
    return await saveDownload(firstEvent.download, challanNumber);
  }

  if (firstEvent?.type === 'popup') {
    log.step('Opening Receipt... (new tab)');
    if (firstEvent.popup.url().startsWith('chrome://')) {
      throw new ReceiptError(ERROR_CODES.SITE_CHANGED, 'Unable to capture receipt. Please try again.');
    }
    return await captureReceipt(firstEvent.popup, challanNumber, captureOpts);
  }

  const latePopup = await popupPromise;
  if (latePopup && !latePopup.url().startsWith('chrome://')) {
    return await captureReceipt(latePopup, challanNumber, captureOpts);
  }
  const lateDownload = await downloadPromise;
  if (lateDownload) {
    return await saveDownload(lateDownload, challanNumber);
  }

  log.step('Opening Receipt... (same page)');
  return await captureReceipt(page, challanNumber, captureOpts);
}

async function refreshCaptchaOnPage(page) {
  log.step('Refreshing captcha...');
  await dismissPortalOverlays(page);
  const img = page.locator(SELECTORS.captchaImage).first();
  await img.waitFor({ state: 'visible', timeout: 8000 });
  const before = await getCaptchaId(page).catch(() => '');

  const refresh = page.locator(SELECTORS.captchaRefresh).first();
  await refresh.click({ timeout: 8000 });

  // Wait until captcha image actually changes
  await page
    .waitForFunction(
      ({ sel, prev }) => {
        const el = document.querySelector(sel);
        if (!el || !el.complete || el.naturalWidth < 20) return false;
        const src = el.getAttribute('src') || '';
        const id = `${src.slice(0, 120)}|${src.length}|${el.naturalWidth}x${el.naturalHeight}`;
        return id !== prev;
      },
      { sel: SELECTORS.captchaImage, prev: before },
      { timeout: 8000 }
    )
    .catch(() => {});

  await page.waitForTimeout(250);

  const input = page.locator(SELECTORS.captchaInput).first();
  if (await input.count()) {
    await input.fill('');
  }
}

/**
 * Best-effort auto-solve via 2Captcha. Manual entry remains available if this fails.
 * @param {string} captchaImage
 * @returns {Promise<{ text: string, taskId: number|string|null }>}
 */
async function trySolveCaptcha(captchaImage) {
  if (!isTwoCaptchaConfigured()) {
    return { text: '', taskId: null };
  }

  try {
    const result = await solveImageCaptcha(captchaImage);
    return { text: result.text, taskId: result.taskId };
  } catch (err) {
    log.warn('2Captcha auto-solve failed; falling back to manual entry', err?.message || err);
    return { text: '', taskId: null };
  }
}

function serviceTileConfig(documentType) {
  if (documentType === 'paymentReceipt') {
    return {
      img: SELECTORS.downloadPaymentReceiptTile,
      text: SELECTORS.downloadPaymentReceiptText,
      label: 'Download Payment Receipt',
    };
  }
  return {
    img: SELECTORS.downloadChallanPrintTile,
    text: SELECTORS.downloadChallanPrintText,
    label: 'Download Challan Print',
  };
}

async function openPortalServiceForm(page, documentType = 'challanPrint') {
  const tile = serviceTileConfig(documentType);
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

  await page.waitForTimeout(500);
  await dismissPortalOverlays(page);

  if (!(await isDownloadFormReady(page))) {
    log.step(`Navigating... ${tile.label}`);
    const openedForm = await openServiceFormFromServices(page, documentType);
    if (!openedForm) {
      throw new ReceiptError(
        ERROR_CODES.SITE_CHANGED,
        `Could not open ${tile.label} form. Please try again.`
      );
    }
  }

  await page.locator(SELECTORS.captchaImage).first().waitFor({ state: 'visible', timeout: 45000 });
  log.step(`${tile.label} form ready`);
}

async function isDownloadFormReady(page) {
  return page
    .locator(SELECTORS.challanNumberInput)
    .first()
    .isVisible()
    .catch(() => false);
}

async function dismissPortalOverlays(page) {
  const candidates = [
    page.locator('.swal2-confirm').first(),
    page.locator('button:has-text("OK")').first(),
    page.locator('button:has-text("Close")').first(),
    page.locator('[aria-label="Close"]').first(),
  ];

  for (const loc of candidates) {
    if (!(await loc.isVisible().catch(() => false))) continue;
    await loc.click({ timeout: 2000 }).catch(() => {});
  }
}

/**
 * Portal SPA is flaky: tile click sometimes does nothing.
 * Retry with image click, text click, parent click, then hard navigation.
 */
async function openServiceFormFromServices(page, documentType = 'challanPrint') {
  const cfg = serviceTileConfig(documentType);
  const strategies = [
    async () => {
      const tile = page.locator(cfg.img).first();
      await tile.waitFor({ state: 'visible', timeout: 30000 });
      await tile.click({ force: true, timeout: 8000 });
    },
    async () => {
      const textLink = page.locator(cfg.text).first();
      await textLink.waitFor({ state: 'visible', timeout: 15000 });
      await textLink.click({ force: true, timeout: 8000 });
    },
    async () => {
      const tile = page.locator(cfg.img).first();
      await tile.waitFor({ state: 'visible', timeout: 15000 });
      await tile.evaluate((el) => {
        const clickable =
          el.closest('a, button, [role="button"], .service-card, .card, .col, div') || el;
        clickable.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      });
    },
    async () => {
      await page.goto(PORTAL.servicesUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.waitForTimeout(500);
      const tile = page.locator(cfg.img).first();
      await tile.waitFor({ state: 'visible', timeout: 30000 });
      await tile.click({ force: true });
      await page.waitForURL(/\/challan\/?$/, { timeout: 15000 }).catch(() => {});
    },
  ];

  for (let i = 0; i < strategies.length; i++) {
    try {
      log.step(`Download form open strategy ${i + 1}/${strategies.length}`);
      await strategies[i]();
      await page
        .locator(SELECTORS.challanNumberInput)
        .first()
        .waitFor({ state: 'visible', timeout: 45000 });
      return true;
    } catch (err) {
      log.warn(`Download form strategy ${i + 1} failed`, err?.message || err);
    }
  }

  return false;
}

async function ensureOnDownloadForm(page, documentType = 'challanPrint') {
  const input = page.locator(SELECTORS.challanNumberInput).first();
  if (await input.isVisible().catch(() => false)) return;

  log.warn(`Form not present — reopening ${serviceTileConfig(documentType).label}`);
  await openPortalServiceForm(page, documentType);
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

async function fillAngularInput(page, locator, value) {
  const text = String(value);
  await locator.waitFor({ state: 'visible', timeout: 10000 });
  await locator.click();
  await locator.fill(text);

  // Ensure Angular ngModel sees the value (fill alone can miss on some builds)
  const current = await locator.inputValue().catch(() => '');
  if (current !== text) {
    await locator.evaluate((el, v) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (setter) setter.call(el, v);
      else el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, text);
  }
}

async function fillChallanNumber(page, challanNumber) {
  const input = page.locator(SELECTORS.challanNumberInput).first();
  await fillAngularInput(page, input, challanNumber);
}

async function fillCaptcha(page, captcha) {
  const input = page.locator(SELECTORS.captchaInput).first();
  await fillAngularInput(page, input, String(captcha).trim());
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

/**
 * Captcha fingerprint used to detect mid-solve refreshes.
 */
async function getCaptchaId(page) {
  const img = page.locator(SELECTORS.captchaImage).first();
  await img.waitFor({ state: 'visible', timeout: 10000 });
  return img.evaluate((el) => {
    const src = el.getAttribute('src') || '';
    // Use a stable slice — full data URIs are huge
    return `${src.slice(0, 120)}|${src.length}|${el.naturalWidth}x${el.naturalHeight}`;
  });
}

async function isSameCaptcha(page, previousId) {
  try {
    const current = await getCaptchaId(page);
    return current === previousId;
  } catch {
    return false;
  }
}

async function readCaptchaImageWithId(page) {
  const img = page.locator(SELECTORS.captchaImage).first();
  await img.waitFor({ state: 'visible', timeout: 10000 });

  // Wait until image has real pixels (avoid blank/partial reads)
  await page
    .waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        return el && el.complete && el.naturalWidth > 20 && el.naturalHeight > 10;
      },
      SELECTORS.captchaImage,
      { timeout: 8000 }
    )
    .catch(() => {});

  await page.waitForTimeout(300);

  const id = await getCaptchaId(page);

  // Prefer element screenshot — more reliable than raw src for 2Captcha OCR
  const buffer = await img.screenshot({ type: 'png' });
  const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
  return { dataUrl, id };
}

async function readCaptchaImage(page) {
  const { dataUrl } = await readCaptchaImageWithId(page);
  return dataUrl;
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

  log.step('Portal message', { text: combined.trim().slice(0, 200) });

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

async function clickResultDocument(page, documentType = 'challanPrint') {
  const wantReceipt = documentType === 'paymentReceipt';
  const candidates = wantReceipt
    ? [
        page.locator('a[title*="Receipt" i]').first(),
        page.locator('button[title*="Receipt" i]').first(),
        page.locator('img[alt*="Receipt" i]').first(),
        page.getByRole('button', { name: /receipt/i }).first(),
        page.getByRole('link', { name: /receipt/i }).first(),
        page.locator('a:has-text("Receipt"), button:has-text("Receipt")').first(),
      ]
    : [
        page.locator('a[title*="Print" i]:not([title*="Receipt" i])').first(),
        page.locator('button[title*="Print" i]:not([title*="Receipt" i])').first(),
        page.locator('img[alt*="Print" i]:not([alt*="Receipt" i])').first(),
        page.locator('i.fa-print').first(),
        page.getByRole('button', { name: /^print$/i }).first(),
        page.getByRole('link', { name: /^print$/i }).first(),
        page.locator('a:has-text("Print"), button:has-text("Print")').first(),
      ];

  for (const loc of candidates) {
    if (!(await loc.count())) continue;
    if (!(await loc.isVisible().catch(() => false))) continue;
    await loc.click({ timeout: 6000 });
    return true;
  }

  return page.evaluate((wantReceiptDoc) => {
    const root =
      document.querySelector('table, .mobile-challan-list, .mobile-challan-card') || document.body;
    const el = [...root.querySelectorAll('a,button,img,i,span')].find((node) => {
      const hay =
        `${node.getAttribute('title') || ''} ${node.getAttribute('alt') || ''} ${node.getAttribute('aria-label') || ''} ${node.textContent || ''}`.toLowerCase();
      if (wantReceiptDoc) {
        return hay.includes('receipt');
      }
      return hay.includes('print') && !hay.includes('receipt');
    });
    if (!el) return false;
    el.click();
    return true;
  }, wantReceipt);
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
