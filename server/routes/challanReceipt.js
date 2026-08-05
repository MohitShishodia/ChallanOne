import express from 'express';
import {
  startCaptchaSession,
  refreshCaptchaSession,
  fetchChallanReceipt,
  autoFetchChallanReceipt,
} from '../services/echallanReceipt/index.js';
import { ReceiptError, ERROR_CODES, friendlyMessage } from '../services/echallanReceipt/errors.js';
import { createLogger } from '../services/echallanReceipt/logger.js';

const router = express.Router();
const log = createLogger('[API/challan/receipt]');

/**
 * POST /api/challan/receipt/auto
 * Fully automatic: portal + 2Captcha + PDF.
 * Falls back with needsCaptcha + session when solver fails.
 * { "challanNumber": "" }
 */
router.post('/auto', async (req, res) => {
  try {
    const { challanNumber, documentType } = req.body || {};
    if (!challanNumber?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'challanNumber is required',
      });
    }

    log.step('Auto-fetching receipt...', { challanNumber, documentType });
    const result = await autoFetchChallanReceipt(String(challanNumber).trim(), { documentType });

    if (result.needsCaptcha) {
      return res.json({
        success: true,
        needsCaptcha: true,
        sessionId: result.sessionId,
        captchaImage: result.captchaImage,
        message: result.message || 'Please enter the captcha to continue.',
      });
    }

    return res.json({
      success: true,
      needsCaptcha: false,
      receiptUrl: result.receiptUrl,
      filename: result.filename,
      contentType: result.contentType,
    });
  } catch (err) {
    return sendError(res, err);
  }
});

/**
 * GET /api/challan/receipt/captcha
 * Opens the portal Download Challan Print form and returns a captcha image.
 * Body/response keeps a short-lived Playwright session for the follow-up POST.
 */
router.get('/captcha', async (req, res) => {
  try {
    const documentType = req.query?.documentType;
    log.step('Starting captcha session...', { documentType });
    const { sessionId, captchaImage, solvedCaptcha, captchaAutoSolved } = await startCaptchaSession(documentType);
    return res.json({
      success: true,
      sessionId,
      captchaImage,
      solvedCaptcha: solvedCaptcha || '',
      captchaAutoSolved: Boolean(captchaAutoSolved),
    });
  } catch (err) {
    return sendError(res, err);
  }
});

/**
 * POST /api/challan/receipt/captcha/refresh
 * { sessionId }
 */
router.post('/captcha/refresh', async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }
    const { captchaImage, solvedCaptcha, captchaAutoSolved } = await refreshCaptchaSession(sessionId);
    return res.json({
      success: true,
      sessionId,
      captchaImage,
      solvedCaptcha: solvedCaptcha || '',
      captchaAutoSolved: Boolean(captchaAutoSolved),
    });
  } catch (err) {
    return sendError(res, err);
  }
});

/**
 * POST /api/challan/receipt
 * Manual fallback after needsCaptcha:
 * {
 *   "challanNumber": "",
 *   "captcha": "",
 *   "sessionId": ""
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { challanNumber, captcha, sessionId } = req.body || {};

    if (!challanNumber || !captcha) {
      return res.status(400).json({
        success: false,
        message: 'challanNumber and captcha are required',
      });
    }

    log.step('Fetching receipt...', { challanNumber });
    const result = await fetchChallanReceipt({
      challanNumber: String(challanNumber).trim(),
      captcha: String(captcha).trim(),
      sessionId,
    });

    return res.json({
      success: true,
      receiptUrl: result.receiptUrl,
      filename: result.filename,
      contentType: result.contentType,
    });
  } catch (err) {
    return sendError(res, err);
  }
});

function sendError(res, err) {
  const code = err instanceof ReceiptError ? err.code : ERROR_CODES.INTERNAL;
  const status = err instanceof ReceiptError ? err.status : 500;
  const message = friendlyMessage(code, err?.message);

  log.error(message, err);
  return res.status(status).json({
    success: false,
    message,
    code,
  });
}

export default router;
