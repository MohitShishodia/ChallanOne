export function normalizeVehicleNumber(vehicleNumber) {
  if (!vehicleNumber) return '';
  return vehicleNumber.replace(/[\s-]/g, '').toUpperCase();
}

export function normalizeMobileNumber(mobileNumber) {
  if (!mobileNumber) return '';
  return mobileNumber.replace(/[\s-]/g, '');
}

export function isValidIndianMobile(mobileNumber) {
  return /^[6-9]\d{9}$/.test(normalizeMobileNumber(mobileNumber));
}

/** Delhi OTP API expects the last 4 characters of chassis/engine when provided. */
export function normalizeLastFourDigits(value) {
  if (!value) return undefined;
  const cleaned = String(value).replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (!cleaned) return undefined;
  return cleaned.slice(-4);
}

export function isValidLastFourDigits(value) {
  if (!value) return true;
  const cleaned = String(value).replace(/[^A-Z0-9]/gi, '');
  return cleaned.length === 4;
}
