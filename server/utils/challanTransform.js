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

export function shouldIncludeDelhiChallan(challan) {
  if (challan.sentToVirtualCourt === true) return false;
  if (challan.paymentStatus && challan.paymentStatus.toUpperCase() !== 'UNPAID') return false;
  return true;
}

export function transformDelhiChallans(challans, vehicleNumber) {
  if (!Array.isArray(challans)) return [];

  return challans
    .filter(shouldIncludeDelhiChallan)
    .map(c => {
      const isCourtChallan = c.courtChallan === true;
      const challanType = c.challanType?.toUpperCase();
      const displayType = getChallanDisplayType({ courtChallan: isCourtChallan, challanType });

      return {
        id: c.challanNumber || c.id,
        challanNumber: c.challanNumber,
        vehicleNumber: vehicleNumber || c.vehicleNumber,
        type: c.violationType || c.offenceDetails || 'Traffic Violation',
        description: c.challanPlace || c.offenceDetails || 'N/A',
        amount: parseFloat(c.amount || c.fineAmount || 0),
        status: 'PENDING',
        date: formatDelhiDate(c.challanDate || c.offenceDate),
        time: formatDelhiTime(c.challanDate || c.offenceDate),
        location: c.challanPlace || c.location || 'Delhi',
        displayType,
        isCourtChallan,
        courtFee: isCourtChallan ? (parseFloat(c.courtFee) || 50) : 0,
        challanType: challanType || 'ONLINE',
        paymentStatus: 'UNPAID',
        accusedName: c.accusedName || c.ownerName || null,
        dlNumber: c.dlNumber || null,
        section: c.section || c.offenceSection || null
      };
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
  const rawChallans = runData?.challans || responseBlock?.pendingChallans;
  const vehicleNumber = runData?.vehicleNumber || runData?.rcNumber || envelope?.rcNumber;

  if (status === 'COMPLETED' && rawChallans) {
    result.challans = transformDelhiChallans(rawChallans, vehicleNumber);
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
