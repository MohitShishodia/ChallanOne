export const FLOW_TYPES = {
  SELECT: 'SELECT',
  DELHI_OTP: 'DELHI_OTP',
  ALL_CHALLANS: 'ALL_CHALLANS'
};

export function getChallanDisplayType({ courtChallan, challanType }) {
  const type = (challanType || '').toUpperCase();
  if (courtChallan === true) return 'Court Challan';
  if (type === 'OFFLINE') return 'Physical Challan';
  return 'E-Challan';
}

/** Exclude only virtual-court challans; paid challans are shown to the user. */
export function shouldExcludeChallan(challan) {
  return challan.sentToVirtualCourt === true;
}

/** @deprecated use shouldExcludeChallan */
export function shouldShowExternalChallan(challan) {
  return !shouldExcludeChallan(challan);
}

export function getNoticeId(raw) {
  return (
    raw.noticeId ||
    raw.noticeNumber ||
    raw.noticeNo ||
    raw.notice_id ||
    raw.challanNumber ||
    raw.id ||
    'N/A'
  );
}

import { getOffenceDetails, getOffenceSection } from './challanFieldHelpers.js';

export { getOffenceDetails, getOffenceSection };

export function resolveChallanStatus(raw) {
  const paymentStatus = (raw.paymentStatus || '').toUpperCase();
  const challanStatus = (raw.challanStatus || '').toLowerCase();
  if (
    paymentStatus === 'PAID' ||
    paymentStatus === 'DISPOSED' ||
    challanStatus === 'paid' ||
    challanStatus === 'cash' ||
    challanStatus === 'disposed' ||
    challanStatus === 'compounded'
  ) {
    return 'PAID';
  }
  return 'PENDING';
}

export function formatChallanDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(dateStr).split(' ')[0] || dateStr;
  }
}

export function formatChallanTime(dateStr) {
  if (!dateStr) return '00:00';
  try {
    const d = new Date(dateStr);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    const parts = String(dateStr).split(' ');
    if (parts[1]) return parts[1].substring(0, 5);
    return '00:00';
  } catch {
    return '00:00';
  }
}

export function mapChallanRecord(raw, vehicleNumber, idx = 0) {
  const isCourtChallan = raw.courtChallan === true;
  const challanType = (raw.challanType || '').toUpperCase();
  const displayType = getChallanDisplayType({ courtChallan: isCourtChallan, challanType });
  const noticeId = getNoticeId(raw);
  const dateSource = raw.challanDate || raw.offenceDate || raw.dateTime;
  const status = resolveChallanStatus(raw);

  return {
    id: noticeId !== 'N/A' ? noticeId : `CH${idx + 1}`,
    noticeId,
    challanNumber: raw.challanNumber || null,
    dbId: raw.challanNumber || noticeId,
    vehicleNumber: vehicleNumber || raw.vehicleNumber,
    offenceDetails: getOffenceDetails(raw),
    type: raw.violationType || raw.challanType || 'N/A',
    description: raw.challanPlace || raw.location || 'N/A',
    amount: parseFloat(raw.amount || raw.fineAmount || 0) || 0,
    status,
    date: formatChallanDate(dateSource),
    time: formatChallanTime(dateSource),
    location: raw.challanPlace || raw.location || 'N/A',
    displayType,
    isCourtChallan,
    courtName: raw.courtName || null,
    courtAddress: raw.courtAddress || null,
    sentToRegCourt:
      raw.sentToRegCourt === true ||
      String(raw.sentToRegCourt || '').toLowerCase() === 'yes',
    courtFee: isCourtChallan ? (parseFloat(raw.courtFee) || 0) : 0,
    section: getOffenceSection(raw),
    accusedName: raw.accusedName || raw.ownerName || null,
    paymentStatus: raw.paymentStatus || raw.challanStatus || null
  };
}

export function collectRawChallans(result) {
  const data = result.data || {};
  return [
    ...(data.pendingChallans || []),
    ...(data.paidChallans || []),
    ...(data.disposedChallans || [])
  ];
}

export function transformExternalChallans(result) {
  const allChallans = collectRawChallans(result);

  const challans = allChallans
    .filter((c) => !shouldExcludeChallan(c))
    .map((c, idx) => mapChallanRecord(c, result.vehicleNumber, idx));

  const firstChallan = allChallans[0];
  const vehicle = {
    number: result.vehicleNumber,
    owner: firstChallan?.accusedName || 'Owner',
    vehicleType: 'Private Vehicle',
    isVerified: true
  };

  const pendingChallans = challans.filter((c) => c.status === 'PENDING');

  return {
    success: true,
    dataSource: result.source || 'EXTERNAL',
    vehicle,
    challans,
    pendingCount: pendingChallans.length,
    paidCount: challans.length - pendingChallans.length,
    hasRawChallans: allChallans.length > 0
  };
}

export function sumChallanFineAmounts(challans) {
  return challans.reduce((sum, c) => sum + (c.amount || 0), 0);
}

export function calculatePaymentTotal(challans, convenienceFee = 20, { includeCourtFees = false } = {}) {
  const subtotal = sumChallanFineAmounts(challans);
  const courtFeeTotal = includeCourtFees
    ? challans.reduce((s, c) => s + (c.courtFee || 0), 0)
    : 0;
  const total = subtotal + courtFeeTotal + convenienceFee;
  return { subtotal, courtFeeTotal, convenienceFee, total };
}
