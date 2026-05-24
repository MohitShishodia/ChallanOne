import { getOffenceDetails, getOffenceSection } from './challanFieldHelpers.js';

export const TERMINAL_STATES = ['COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED'];

export function isTerminalRunStatus(status) {
  return TERMINAL_STATES.includes(status);
}

export function getChallanDisplayType({ courtChallan, challanType }) {
  const type = challanType?.toUpperCase();
  if (courtChallan === true) return 'Court Challan';
  if (type === 'OFFLINE') return 'Physical Challan';
  return 'E-Challan';
}

export function shouldExcludeDelhiChallan(challan) {
  return challan.sentToVirtualCourt === true;
}

/** @deprecated use shouldExcludeDelhiChallan */
export function shouldIncludeDelhiChallan(challan) {
  return !shouldExcludeDelhiChallan(challan);
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

export function transformDelhiChallans(challans, vehicleNumber) {
  if (!Array.isArray(challans)) return [];

  return challans
    .filter((c) => !shouldExcludeDelhiChallan(c))
    .map((c, idx) => {
      const isCourtChallan = c.courtChallan === true;
      const challanType = c.challanType?.toUpperCase();
      const displayType = getChallanDisplayType({ courtChallan: isCourtChallan, challanType });
      const noticeId = getNoticeId(c);
      const dateSource = c.challanDate || c.offenceDate;
      const status = resolveChallanStatus(c);

      return {
        id: noticeId !== 'N/A' ? noticeId : `CH${idx + 1}`,
        noticeId,
        challanNumber: c.challanNumber,
        vehicleNumber: vehicleNumber || c.vehicleNumber,
        offenceDetails: getOffenceDetails(c),
        type: c.violationType || c.challanType || 'Traffic Violation',
        description: c.challanPlace || c.offenceDetails || 'N/A',
        amount: parseFloat(c.amount || c.fineAmount || 0),
        status,
        date: formatDelhiDate(dateSource),
        time: formatDelhiTime(dateSource),
        location: c.challanPlace || c.location || 'Delhi',
        displayType,
        isCourtChallan,
        courtName: c.courtName || null,
        courtAddress: c.courtAddress || null,
        sentToRegCourt:
          c.sentToRegCourt === true ||
          String(c.sentToRegCourt || '').toLowerCase() === 'yes',
        courtFee: isCourtChallan ? (parseFloat(c.courtFee) || 0) : 0,
        challanType: challanType || 'ONLINE',
        paymentStatus: c.paymentStatus || c.challanStatus || null,
        accusedName: c.accusedName || c.ownerName || null,
        dlNumber: c.dlNumber || null,
        section: getOffenceSection(c)
      };
    });
}

function collectRunChallans(runData, responseBlock) {
  const lists = [
    ...(Array.isArray(runData?.challans) ? runData.challans : []),
    ...(responseBlock?.pendingChallans || []),
    ...(responseBlock?.paidChallans || []),
    ...(responseBlock?.disposedChallans || [])
  ];

  const seen = new Set();
  return lists.filter((c) => {
    const key = getNoticeId(c) + '|' + (c.challanNumber || '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildRunPollResult(runId, runData, message, envelope = null) {
  const status = runData?.status;
  const isTerminal = isTerminalRunStatus(status);
  const challenge = envelope?.interactiveChallenge || runData?.interactiveChallenge || runData?.data?.interactiveChallenge;

  const result = {
    success: true,
    runId,
    status,
    isTerminal,
    nextAction: challenge?.nextAction || null,
    message: message || null
  };

  const responseBlock = envelope?.inner?.response || runData?.data?.response;
  const rawChallans = collectRunChallans(runData, responseBlock);
  const vehicleNumber = runData?.vehicleNumber || runData?.rcNumber || envelope?.rcNumber;

  if (status === 'COMPLETED' && rawChallans.length > 0) {
    result.challans = transformDelhiChallans(rawChallans, vehicleNumber);
    result.vehicleNumber = vehicleNumber;
  } else if (status === 'COMPLETED') {
    result.challans = [];
    result.vehicleNumber = vehicleNumber;
  }

  if (status === 'FAILED') {
    result.failureReason = runData?.failureReason || message || 'Run failed';
  }

  if (status === 'EXPIRED') {
    result.failureReason = 'OTP session expired. Please start a new request.';
  }

  return result;
}

export function mapOtpActionError(data, httpStatus) {
  if (httpStatus === 410 || data?.error?.code === 'RUN_EXPIRED') {
    return { status: 410, body: { success: false, message: 'OTP session has expired. Please start a new request.', expired: true } };
  }
  if (data?.error?.code === 'INVALID_OTP') {
    return { status: 422, body: { success: false, message: 'Invalid OTP. Please check and try again.', retriable: true } };
  }
  if (data?.error?.code === 'MAX_RETRIES_EXCEEDED') {
    return { status: 429, body: { success: false, message: 'Maximum OTP attempts exceeded. Please start a new request.', retriable: false } };
  }
  return null;
}

function formatDelhiDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function formatDelhiTime(dateStr) {
  if (!dateStr) return '00:00';
  try {
    const d = new Date(dateStr);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return '00:00';
  } catch {
    return '00:00';
  }
}
