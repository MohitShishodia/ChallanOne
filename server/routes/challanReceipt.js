import express from 'express';
import { startCaptchaSession, refreshCaptchaSession, fetchChallanReceipt } from '../services/echallanReceipt/index.js';
import { ReceiptError, ERROR_CODES, friendlyMessage } from '../services/echallanReceipt/errors.js';
import { createLogger } from '../services/echallanReceipt/logger.js';

const router = express.Router();
const log = createLogger('[API/challan/receipt]');

/**
 * GET /api/challan/receipt/captcha
 * Opens the portal Download Challan Print form and returns a captcha image.
 * Body/response keeps a short-lived Playwright session for the follow-up POST.
 */
router.get('/captcha', async (_req, res) => {
  try {
    log.step('Starting captcha session...');
    const { sessionId, captchaImage } = await startCaptchaSession();
    return res.json({
      success: true,
      sessionId,
      captchaImage,
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
    const { captchaImage } = await refreshCaptchaSession(sessionId);
    return res.json({ success: true, sessionId, captchaImage });
  } catch (err) {
    return sendError(res, err);
  }
});

/**
 * POST /api/challan/receipt
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
