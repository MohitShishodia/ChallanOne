/**
 * Centralized selectors for the Government NextGen eChallan portal.
 * Update this file if the government UI changes.
 * Verified against https://echallan.parivahan.nic.in/challan/challan-services
 */

export const PORTAL = {
  servicesUrl: 'https://echallan.parivahan.nic.in/challan/challan-services',
  challanUrl: 'https://echallan.parivahan.nic.in/challan',
  homeUrl: 'https://echallan.parivahan.nic.in',
};

export const SELECTORS = {
  downloadChallanPrintTile: 'img[alt="Download Challan Print"]',
  downloadChallanPrintText: 'text=Download Challan Print',

  /** Search type radios on Download Challan Print */
  searchTypeChallan: '#CHLN',
  searchTypeVehicle: '#RC',
  searchTypeDl: '#DL',

  challanNumberInput: 'input[placeholder="Enter Challan Number"]',
  captchaImage: 'img.captcha-image',
  captchaRefresh: 'img.refresh-captcha-img',
  captchaInput: 'input.captcha-input, input[placeholder="Enter Captcha Here"]',
  getDetailsButton: 'button.get-details-btn',
  goBackButton: 'button.bck-btn',

  /** Results area after GET DETAILS */
  resultsTable: 'table, .mobile-challan-list, .mobile-challan-card',
  printButton: [
    'a[title*="Print" i]',
    'button[title*="Print" i]',
    'img[alt*="Print" i]',
    'i.fa-print',
    'a:has-text("Print")',
    'button:has-text("Print")',
    '[class*="print" i]',
    'td a img',
    '.mobile-challan-card a',
    '.mobile-challan-card button',
  ].join(', '),

  alertMessage: [
    '.alert',
    '.swal2-html-container',
    '.swal2-content',
    '[role="alert"]',
    '.toast',
    '.error-message',
  ].join(', '),
};

export const ERROR_PATTERNS = {
  invalidCaptcha: /invalid\s*captcha|captcha\s*(is\s*)?(incorrect|wrong|mismatch|expired)|please\s*enter\s*(valid\s*)?captcha|captcha\s*does\s*not\s*match/i,
  invalidChallan: /invalid\s*challan|challan\s*number\s*(is\s*)?(invalid|incorrect)/i,
  notFound: /challan\s*not\s*found|no\s*(record|data|challan)\s*found|no\s*challan/i,
  portalDown: /service\s*unavailable|temporarily\s*unavailable|maintenance|gateway\s*timeout/i,
};
