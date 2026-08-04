import fs from 'fs';
import { chromium } from 'playwright';
import { createLogger } from './logger.js';
import {
  ensureReceiptsDir,
  buildReceiptFilename,
  publicReceiptUrl,
  absoluteReceiptPath,
} from './paths.js';
import { ReceiptError, ERROR_CODES } from './errors.js';

const log = createLogger();

const LOADING_MARKERS = [
  'Preparing Challans for Print',
  'Preparing Challan',
  'Please wait',
];

/**
 * Capture receipt from a newly opened page / PDF response.
 * Never relies on chrome://print or the native print dialog.
 *
 * @param {import('playwright').Page} receiptPage
 * @param {string} challanNumber
 * @param {{ browserName?: string }} [opts]
 */
export async function captureReceipt(receiptPage, challanNumber, opts = {}) {
  ensureReceiptsDir();
  log.step('Receipt Found... capturing');

  await receiptPage.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
  await receiptPage.context().unroute('**/*').catch(() => {});

  const url = receiptPage.url();
  log.step('Opening Receipt...', url);

  if (url.startsWith('chrome://print') || url.startsWith('chrome://')) {
    throw new ReceiptError(
      ERROR_CODES.SITE_CHANGED,
      'Unable to capture receipt print view. Please try again.'
    );
  }

  const contentType = await detectContentType(receiptPage);
  if (contentType.includes('pdf') || /\.pdf(\?|$)/i.test(url)) {
    log.step('Saving PDF... (direct PDF response)');
    return savePdfFromPage(receiptPage, challanNumber, url);
  }

  await waitForReceiptReady(receiptPage, challanNumber);

  const filename = buildReceiptFilename(challanNumber, 'pdf');
  const filePath = absoluteReceiptPath(filename);

  const browserName = opts.browserName || '';
  const canNativePdf = browserName === 'chromium' || browserName === '';

  if (canNativePdf) {
    try {
      log.step('Saving PDF... (page.pdf)');
      const pdfBuffer = await receiptPage.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '8mm', right: '8mm', bottom: '8mm', left: '8mm' },
      });
      fs.writeFileSync(filePath, pdfBuffer);
      const receiptUrl = publicReceiptUrl(filename);
      log.step('Returning URL...', receiptUrl);
      return { receiptUrl, filename, contentType: 'application/pdf' };
    } catch (err) {
      log.warn('page.pdf failed — falling back to Chromium HTML render', err.message);
    }
  } else {
    log.step(`Saving PDF... (${browserName} has no page.pdf, using Chromium render)`);
  }

  // Firefox/WebKit (or chromium pdf failure): render HTML via Chromium
  const html = await receiptPage.content();
  return renderHtmlToPdfWithChromium(html, challanNumber, filename, filePath);
}

/**
 * Playwright page.pdf() only works in Chromium.
 * For Firefox sessions, open the captured HTML in Chromium and print to PDF.
 */
async function renderHtmlToPdfWithChromium(html, challanNumber, filename, filePath) {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '8mm', right: '8mm', bottom: '8mm', left: '8mm' },
    });
    fs.writeFileSync(filePath, pdfBuffer);

    const receiptUrl = publicReceiptUrl(filename);
    log.step('Returning URL...', receiptUrl);
    return { receiptUrl, filename, contentType: 'application/pdf' };
  } catch (err) {
    throw new ReceiptError(
      ERROR_CODES.INTERNAL,
      `Unable to generate receipt PDF: ${err.message}`
    );
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

async function waitForReceiptReady(page, challanNumber) {
  log.step('Waiting for receipt content to finish loading...');

  try {
    await page.waitForFunction(
      ({ challan, loadingMarkers }) => {
        const body = document.body;
        if (!body) return false;

        const text = (body.innerText || '').replace(/\s+/g, ' ').trim();
        if (text.length < 60) return false;

        const stillLoading = loadingMarkers.some((m) => text.includes(m));
        if (stillLoading) return false;

        const preloader = document.querySelector('app-pre-loader');
        if (preloader && preloader.children.length > 0 && preloader.offsetParent !== null) {
          const preText = (preloader.innerText || '').trim();
          if (preText && loadingMarkers.some((m) => preText.includes(m))) return false;
        }

        const hasTable = Boolean(
          document.querySelector('table, table.challan, table.main-table, .challan-wrapper table')
        );
        const hasChallanNo = challan ? text.includes(String(challan)) : false;
        const hasReceiptMarkers =
          /Challan\s*no|चालान|Vehicle\s*no|वाहन|Traffic Police|Offence|Penalty|Owner/i.test(text);

        return hasTable || hasChallanNo || hasReceiptMarkers;
      },
      { challan: challanNumber || '', loadingMarkers: LOADING_MARKERS },
      { timeout: 20000 }
    );
  } catch {
    // Give a short extra grace period before giving up
    const bodyText = (await page.locator('body').innerText().catch(() => '')) || '';
    if (bodyText.length > 100) {
      log.step('Receipt content check timed out but page has content — proceeding');
      return;
    }
    if (isLoadingText(bodyText)) {
      throw new ReceiptError(
        ERROR_CODES.TIMEOUT,
        'Receipt is still loading. Please try again.'
      );
    }
    throw new ReceiptError(
      ERROR_CODES.NOT_FOUND,
      'Could not load the challan receipt. Please try again.'
    );
  }

  log.step('Receipt content ready');
}

function isLoadingText(text) {
  const normalized = String(text || '');
  return LOADING_MARKERS.some((m) => normalized.includes(m));
}

async function detectContentType(page) {
  try {
    return await page.evaluate(() => document.contentType || '');
  } catch {
    return '';
  }
}

async function savePdfFromPage(page, challanNumber, url) {
  const filename = buildReceiptFilename(challanNumber, 'pdf');
  const filePath = absoluteReceiptPath(filename);

  try {
    const response = await page.request.get(url);
    const body = await response.body();
    if (body?.length > 100) {
      fs.writeFileSync(filePath, body);
      const receiptUrl = publicReceiptUrl(filename);
      log.step('Returning URL...', receiptUrl);
      return { receiptUrl, filename, contentType: 'application/pdf' };
    }
  } catch (err) {
    log.warn('Direct PDF fetch failed, falling back', err.message);
  }

  await waitForReceiptReady(page, challanNumber).catch(() => {});
  const html = await page.content();
  return renderHtmlToPdfWithChromium(html, challanNumber, filename, filePath);
}

/**
 * @param {import('playwright').Download} download
 * @param {string} challanNumber
 */
export async function saveDownload(download, challanNumber) {
  ensureReceiptsDir();
  const suggested = download.suggestedFilename() || '';
  const filename = buildReceiptFilename(challanNumber, 'pdf');
  const filePath = absoluteReceiptPath(filename);
  log.step('Saving PDF... (download event)', suggested || filename);
  await download.saveAs(filePath);
  const receiptUrl = publicReceiptUrl(filename);
  log.step('Returning URL...', receiptUrl);
  return { receiptUrl, filename, contentType: 'application/pdf' };
}
