import fs from 'fs';
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
 * @returns {Promise<{ receiptUrl: string, filename: string, contentType: string }>}
 */
export async function captureReceipt(receiptPage, challanNumber) {
  ensureReceiptsDir();
  log.step('Receipt Found... capturing');

  await receiptPage.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});

  // Unblock fonts/images so the receipt (logos + text) renders correctly in the PDF
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

  // Critical: wait until loading spinner is gone and real receipt content is present
  await waitForReceiptReady(receiptPage, challanNumber);

  log.step('Saving PDF... (HTML receipt → page.pdf)');
  const filename = buildReceiptFilename(challanNumber, 'pdf');
  const filePath = absoluteReceiptPath(filename);

  // Give layout/fonts a brief settle after content appears
  await receiptPage.waitForTimeout(400);

  const pdfBuffer = await receiptPage.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '8mm', right: '8mm', bottom: '8mm', left: '8mm' },
  });

  if (!pdfBuffer || pdfBuffer.length < 15000) {
    // Still suspiciously small — likely captured a blank/loading frame
    const bodyText = await receiptPage.locator('body').innerText().catch(() => '');
    if (isLoadingText(bodyText)) {
      throw new ReceiptError(
        ERROR_CODES.TIMEOUT,
        'Receipt is still loading. Please try again.'
      );
    }
  }

  fs.writeFileSync(filePath, pdfBuffer);

  const receiptUrl = publicReceiptUrl(filename);
  log.step('Returning URL...', receiptUrl);
  return { receiptUrl, filename, contentType: 'application/pdf' };
}

/**
 * Wait until portal loading UI is gone and receipt content is visible.
 */
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

        // Pre-loader component still visible
        const preloader = document.querySelector('app-pre-loader');
        if (preloader && preloader.children.length > 0 && preloader.offsetParent !== null) {
          const preText = (preloader.innerText || '').trim();
          if (preText && loadingMarkers.some((m) => preText.includes(m))) return false;
        }

        const hasTable = Boolean(
          document.querySelector('table.challan, table.main-table, .challan-wrapper table')
        );
        const hasChallanNo = challan ? text.includes(String(challan)) : false;
        const hasReceiptMarkers =
          /Challan\s*no|चालान|Vehicle\s*no|वाहन|Traffic Police|Offence|Penalty|Owner/i.test(text);

        return hasTable || hasChallanNo || hasReceiptMarkers;
      },
      { challan: challanNumber || '', loadingMarkers: LOADING_MARKERS },
      { timeout: 45000 }
    );
  } catch {
    const bodyText = (await page.locator('body').innerText().catch(() => '')) || '';
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
    log.warn('Direct PDF fetch failed, falling back to page.pdf()', err.message);
  }

  await waitForReceiptReady(page, challanNumber).catch(() => {});
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
  });
  fs.writeFileSync(filePath, pdfBuffer);
  const receiptUrl = publicReceiptUrl(filename);
  log.step('Returning URL...', receiptUrl);
  return { receiptUrl, filename, contentType: 'application/pdf' };
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
