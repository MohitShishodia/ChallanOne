/**
 * ChallanWala Delhi OTP API payload/response helpers.
 * Field names differ from our internal naming — see corporate-api/challan-otp contract.
 */

/** Actions accepted by ChallanWala OTP interactive API (all providers). */
export const ALLOWED_OTP_ACTIONS = [
  'SUBMIT_MOBILE',
  'SUBMIT_FETCH_OTP',
  'SUBMIT_LINK_OTP',
  'SUBMIT_CHASSIS',
  'RESEND_FETCH_OTP',
  'RESEND_LINK_OTP',
  'RESEND_OTP',
  'CANCEL_RUN',
  'CANCEL'
];

export const OTP_SUBMIT_ACTIONS = ['SUBMIT_FETCH_OTP', 'SUBMIT_LINK_OTP'];
export const DEFAULT_OTP_SUBMIT_ACTION = 'SUBMIT_FETCH_OTP';
export const DEFAULT_OTP_RESEND_ACTION = 'RESEND_FETCH_OTP';
export const DEFAULT_CANCEL_ACTION = 'CANCEL_RUN';

export function isOtpSubmitAction(action) {
  return OTP_SUBMIT_ACTIONS.includes(action);
}

export function resolveOtpSubmitAction(nextAction) {
  if (isOtpSubmitAction(nextAction)) return nextAction;
  return DEFAULT_OTP_SUBMIT_ACTION;
}

export function resolveActionsFromChallenge(challenge) {
  const available = challenge?.availableActions || [];
  const next = challenge?.nextAction;

  const resendAction =
    available.find((a) => a.startsWith('RESEND_')) ||
    DEFAULT_OTP_RESEND_ACTION;

  const cancelAction =
    available.find((a) => a.startsWith('CANCEL')) ||
    DEFAULT_CANCEL_ACTION;

  return {
    nextOtpAction: resolveOtpSubmitAction(next),
    resendAction,
    cancelAction,
    availableActions: available
  };
}

export function formatChallanWalaError(data) {
  if (!data) return 'Request failed';
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    const field = first.field ? `${first.field}: ` : '';
    return first.message ? `${field}${first.message}` : data.message || 'Validation error';
  }
  return data.message || 'Request failed';
}

export function extractRunEnvelope(runData) {
  if (!runData) return { runId: null, status: null, interactiveChallenge: null, inner: null };

  const inner = runData.data || {};
  const interactiveChallenge =
    inner.interactiveChallenge ||
    runData.interactiveChallenge ||
    null;

  return {
    runId: runData.runId,
    status: runData.status,
    rcNumber: runData.rcNumber || inner.rcNumber,
    interactiveChallenge,
    inner
  };
}

/** Build POST /runs body for ChallanWala. */
export function buildCreateRunPayload({ vehicleNumber, mobileNumber, chassisNumber, engineNumber }) {
  const payload = {
    rc_number: vehicleNumber,
    otpSource: { code: 'DELHI_OTP' }
  };

  if (mobileNumber) payload.mobileNumber = mobileNumber;
  if (chassisNumber) payload.chassisLast4 = chassisNumber;
  if (engineNumber) payload.engineLast4 = engineNumber;

  return payload;
}

/** Build POST /runs/:id/actions body; maps client payload to API field names. */
export function buildActionRequestBody(action, payload = {}) {
  const body = { action };

  if (action === 'SUBMIT_MOBILE') {
    body.payload = {};
    if (payload.mobileNumber) body.payload.mobileNumber = payload.mobileNumber;
    if (payload.chassisNumber) body.payload.chassisLast4 = payload.chassisNumber;
    if (payload.engineNumber) body.payload.engineLast4 = payload.engineNumber;
    if (payload.chassisLast4) body.payload.chassisLast4 = payload.chassisLast4;
    if (payload.engineLast4) body.payload.engineLast4 = payload.engineLast4;
  } else if (isOtpSubmitAction(action)) {
    body.payload = { otp: String(payload.otp || '').trim() };
  } else if (payload && Object.keys(payload).length > 0) {
    body.payload = payload;
  }

  return body;
}
