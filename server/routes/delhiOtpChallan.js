import express from 'express';
import {
  normalizeVehicleNumber,
  normalizeMobileNumber,
  isValidIndianMobile,
  normalizeLastFourDigits,
  isValidLastFourDigits
} from '../utils/normalize.js';
import {
  transformDelhiChallans,
  buildRunPollResult,
  mapOtpActionError
} from '../utils/challanTransform.js';
import {
  buildCreateRunPayload,
  buildActionRequestBody,
  extractRunEnvelope,
  formatChallanWalaError,
  ALLOWED_OTP_ACTIONS,
  isOtpSubmitAction,
  resolveActionsFromChallenge
} from '../utils/delhiOtpApi.js';
import { logChallanSearch } from '../utils/searchLogger.js';

const router = express.Router();

const CHALLANWALA_BASE_URL = 'https://api.challanwala.com/api/v1/corporate-api/challan-otp';
const CHALLANWALA_TOKEN = process.env.CHALLANWALA_TOKEN || '';

const OTP_SOURCE_CODE = 'DELHI_OTP';

function attachChallengeActions(result, envelope) {
  const actions = resolveActionsFromChallenge(envelope.interactiveChallenge);
  return Object.assign(result, actions);
}

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${CHALLANWALA_TOKEN}`
  };
}

router.post('/runs', async (req, res) => {
  try {
    const { vehicleNumber, chassisNumber, engineNumber, mobileNumber } = req.body;

    if (!vehicleNumber || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle number and mobile number are required'
      });
    }

    const normalizedVehicle = normalizeVehicleNumber(vehicleNumber);
    const normalizedMobile = normalizeMobileNumber(mobileNumber);

    if (!isValidIndianMobile(normalizedMobile)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number. Must be a valid 10-digit Indian mobile number.'
      });
    }

    if (chassisNumber && !isValidLastFourDigits(chassisNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Chassis number must be exactly 4 characters (last 4 digits of chassis).'
      });
    }

    if (engineNumber && !isValidLastFourDigits(engineNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Engine number must be exactly 4 characters (last 4 digits of engine).'
      });
    }

    console.log(`[DelhiOTP] Creating run for vehicle: ${normalizedVehicle}, mobile: ${normalizedMobile}`);

    const normalizedChassis = normalizeLastFourDigits(chassisNumber);
    const normalizedEngine = normalizeLastFourDigits(engineNumber);

    const payload = buildCreateRunPayload({
      vehicleNumber: normalizedVehicle,
      mobileNumber: normalizedMobile,
      chassisNumber: normalizedChassis,
      engineNumber: normalizedEngine
    });

    const response = await fetch(`${CHALLANWALA_BASE_URL}/runs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('[DelhiOTP] Run creation failed:', data);
      return res.status(response.status || 502).json({
        success: false,
        message: formatChallanWalaError(data),
        error: data.error || data.errors || null
      });
    }

    const envelope = extractRunEnvelope(data.data);
    const actions = resolveActionsFromChallenge(envelope.interactiveChallenge);
    console.log(`[DelhiOTP] Run created: ${envelope.runId}`);

    logChallanSearch(req, {
      vehicleNumber: normalizedVehicle,
      searchType: 'DELHI_OTP',
      status: 'success',
      challansFound: 0,
      metadata: { runId: envelope.runId, stage: 'run_created' }
    });

    return res.json({
      success: true,
      runId: envelope.runId,
      status: envelope.status,
      nextAction: envelope.interactiveChallenge?.nextAction || 'SUBMIT_MOBILE',
      nextOtpAction: actions.nextOtpAction,
      resendAction: actions.resendAction,
      cancelAction: actions.cancelAction,
      availableActions: actions.availableActions,
      message: data.message || 'Run created successfully'
    });

  } catch (error) {
    console.error('[DelhiOTP] Run creation error:', error);
    logChallanSearch(req, {
      vehicleNumber: req.body?.vehicleNumber || 'UNKNOWN',
      searchType: 'DELHI_OTP',
      status: 'failed',
      errorMessage: error.message
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating Delhi OTP run',
      error: error.message
    });
  }
});

router.get('/runs/:runId', async (req, res) => {
  try {
    const { runId } = req.params;

    if (!runId) {
      return res.status(400).json({
        success: false,
        message: 'Run ID is required'
      });
    }

    console.log(`[DelhiOTP] Polling run: ${runId}`);

    const response = await fetch(`${CHALLANWALA_BASE_URL}/runs/${runId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('[DelhiOTP] Run poll failed:', data);
      return res.status(response.status || 502).json({
        success: false,
        message: formatChallanWalaError(data),
        error: data.error || data.errors || null
      });
    }

    const envelope = extractRunEnvelope(data.data);
    return res.json(attachChallengeActions(buildRunPollResult(runId, data.data || {}, data.message, envelope), envelope));

  } catch (error) {
    console.error('[DelhiOTP] Run poll error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while polling Delhi OTP run',
      error: error.message
    });
  }
});

router.post('/runs/:runId/actions', async (req, res) => {
  try {
    const { runId } = req.params;
    const { action, payload } = req.body;

    if (!runId) {
      return res.status(400).json({
        success: false,
        message: 'Run ID is required'
      });
    }

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action is required'
      });
    }

    if (!ALLOWED_OTP_ACTIONS.includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Invalid action. Must be one of: ${ALLOWED_OTP_ACTIONS.join(', ')}`
      });
    }

    if (isOtpSubmitAction(action) && (!payload?.otp || String(payload.otp).length < 4)) {
      return res.status(400).json({
        success: false,
        message: 'A valid OTP is required for OTP verification'
      });
    }

    console.log(`[DelhiOTP] Submitting action: ${action} for run: ${runId}`);

    const requestBody = buildActionRequestBody(action, payload);

    const response = await fetch(`${CHALLANWALA_BASE_URL}/runs/${runId}/actions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('[DelhiOTP] Action submission failed:', data);

      const mapped = mapOtpActionError(data, response.status);
      if (mapped) {
        return res.status(mapped.status).json(mapped.body);
      }

      return res.status(response.status || 502).json({
        success: false,
        message: formatChallanWalaError(data),
        error: data.error || data.errors || null
      });
    }

    const envelope = extractRunEnvelope(data.data);
    return res.json(attachChallengeActions(
      buildRunPollResult(runId, data.data || {}, data.message || 'Action submitted successfully', envelope),
      envelope
    ));

  } catch (error) {
    console.error('[DelhiOTP] Action submission error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while submitting action',
      error: error.message
    });
  }
});

export { transformDelhiChallans, ALLOWED_OTP_ACTIONS };
export default router;
