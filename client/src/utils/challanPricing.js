import { getOffenceDetails } from './challanFieldHelpers.js';

const ZERO_AMOUNT_FINES = [
  { keywords: ['no entry', 'no-entry', 'noentry'], amount: 20000 },
  { keywords: ['drink', 'drunk', 'alcohol', 'intoxicat', 'dui'], amount: 10000 },
  { keywords: ['overspeed', 'over speed', 'over-speed', 'speeding'], amount: 2000 },
  { keywords: ['red light', 'red signal', 'signal jump', 'traffic signal'], amount: 1000 },
  { keywords: ['seat belt', 'seatbelt', 'seat-belt'], amount: 1000 }
];

function isWasZeroAmount(raw) {
  return raw?.wasZeroAmount === true || raw?.was_zero_amount === true;
}

function getRawApiAmount(raw) {
  return parseFloat(raw?.amount || raw?.fineAmount || 0) || 0;
}

function matchZeroAmountFine(offenceText) {
  const normalized = String(offenceText || '').toLowerCase();
  for (const rule of ZERO_AMOUNT_FINES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.amount;
    }
  }
  return null;
}

export function resolveChallanAmount(raw, offenceDetails = null) {
  if (!isWasZeroAmount(raw)) {
    return getRawApiAmount(raw);
  }

  const offenceText =
    offenceDetails ||
    getOffenceDetails(raw) ||
    raw?.violationType ||
    raw?.challanType ||
    '';

  const matchedAmount = matchZeroAmountFine(offenceText);
  if (matchedAmount !== null) {
    return matchedAmount;
  }

  return getRawApiAmount(raw);
}
