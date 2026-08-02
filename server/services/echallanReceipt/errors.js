/**
 * Domain errors with stable codes for friendly API messages.
 */

export class ReceiptError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {{ status?: number, details?: unknown }} [opts]
   */
  constructor(code, message, opts = {}) {
    super(message);
    this.name = 'ReceiptError';
    this.code = code;
    this.status = opts.status || 400;
    this.details = opts.details;
  }
}

export const ERROR_CODES = {
  INVALID_CAPTCHA: 'INVALID_CAPTCHA',
  INVALID_CHALLAN: 'INVALID_CHALLAN',
  NOT_FOUND: 'NOT_FOUND',
  TIMEOUT: 'TIMEOUT',
  PORTAL_DOWN: 'PORTAL_DOWN',
  SITE_CHANGED: 'SITE_CHANGED',
  VALIDATION: 'VALIDATION',
  INTERNAL: 'INTERNAL',
};

export function friendlyMessage(code, fallback) {
  switch (code) {
    case ERROR_CODES.INVALID_CAPTCHA:
      return 'Invalid captcha. Please try again.';
    case ERROR_CODES.INVALID_CHALLAN:
      return 'Invalid challan number. Please check and try again.';
    case ERROR_CODES.NOT_FOUND:
      return 'Challan not found. Please check the challan number.';
    case ERROR_CODES.TIMEOUT:
      return 'Request timed out. Please try again.';
    case ERROR_CODES.PORTAL_DOWN:
      return 'Receipt service is temporarily unavailable. Please try again later.';
    case ERROR_CODES.SITE_CHANGED:
      return 'Unable to fetch receipt right now. Please try again.';
    case ERROR_CODES.VALIDATION:
      return fallback || 'Invalid request.';
    default:
      return fallback || 'Unable to fetch challan receipt. Please try again.';
  }
}
