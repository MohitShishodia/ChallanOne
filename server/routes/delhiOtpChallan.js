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
import { syncRawChallans } from '../utils/challanSync.js';

const router = express.Router();

const CHALLANWALA_BASE_URL = 'https://api.challanwala.com/api/v1/corporate-api/challan-otp';
const CHALLANWALA_TOKEN = process.env.CHALLANWALA_TOKEN || '';

// APIClub — used for auto-fetching chassis/engine numbers from RC info
const APICLUB_BASE_URL = 'https://prod.apiclub.in/api/v1';
const APICLUB_API_KEY = process.env.APICLUB_API_KEY || '';

const OTP_SOURCE_CODE = 'DELHI_OTP';

// In-memory cache: runId -> { chassisLast4, engineLast4, vehicleNumber }
// Stores RC details fetched during run creation so the SUBMIT_MOBILE action can reuse them.
const runRcCache = new Map();

/**
 * Fetch chassis and engine last-4 digits from RC API.
 * Returns { chassisLast4, engineLast4 } or undefined values on failure.
 */
async function fetchRcDetails(vehicleNumber) {
  try {
    console.log(`[DelhiOTP] Fetching RC info for chassis/engine: ${vehicleNumber}`);
    const response = await fetch(`${APICLUB_BASE_URL}/rc_info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': APICLUB_API_KEY
      },
      body: JSON.stringify({ vehicleId: vehicleNumber })
    });

    const data = await response.json();

    if (!data || data.error || data.status === 'error') {
      console.warn('[DelhiOTP] RC API returned error, proceeding without chassis/engine:', data?.message || 'Unknown');
      return { chassisLast4: undefined, engineLast4: undefined };
    }

    // Log raw response keys for debugging
    console.log('[DelhiOTP] RC API raw response keys:', JSON.stringify(Object.keys(data)));

    // APIClub nests vehicle record in response; older shapes may use data/result
    const record = data.response || data.data || data.result || data;

    if (typeof record === 'object' && record !== null) {
      console.log('[DelhiOTP] RC record keys:', JSON.stringify(Object.keys(record)));
    }

    // Try all known key patterns for chassis and engine across top-level and nested
    const chassis =
      record.vehicle_chasi_no || record.chassis_number || record.chassisNumber ||
      record.chasi_no || record.chasiNo || record.chassis_no || record.chassisNo ||
      data.vehicle_chasi_no || data.chassis_number || data.chassisNumber || '';

    const engine =
      record.vehicle_engine_no || record.engine_number || record.engineNumber ||
      record.engine_no || record.engineNo ||
      data.vehicle_engine_no || data.engine_number || data.engineNumber || '';

    console.log(`[DelhiOTP] Extracted — chassis: "${chassis}", engine: "${engine}"`);

    const chassisLast4 = normalizeLastFourDigits(chassis);
    const engineLast4 = normalizeLastFourDigits(engine);

    console.log(`[DelhiOTP] RC lookup result — chassis last 4: ${chassisLast4 || 'N/A'}, engine last 4: ${engineLast4 || 'N/A'}`);
    return { chassisLast4, engineLast4 };
  } catch (err) {
    console.warn('[DelhiOTP] RC API call failed, proceeding without chassis/engine:', err.message);
    return { chassisLast4: undefined, engineLast4: undefined };
  }
}

async function syncCompletedRunChallans(runData, envelope) {
  const responseBlock = envelope?.inner?.response || runData?.data?.response;
  const rawLists = [
    ...(Array.isArray(runData?.challans) ? runData.challans : []),
    ...(responseBlock?.pendingChallans || []),
    ...(responseBlock?.paidChallans || []),
    ...(responseBlock?.disposedChallans || [])
  ];
  const vehicleNumber = runData?.vehicleNumber || runData?.rcNumber || envelope?.rcNumber;
  if (!vehicleNumber || rawLists.length === 0) return;

  try {
    await syncRawChallans(vehicleNumber, rawLists, 'delhi_otp');
  } catch (err) {
    console.error('[DelhiOTP] Sync to DB failed:', err.message);
  }
}

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
    const { vehicleNumber, mobileNumber } = req.body;

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

    console.log(`[DelhiOTP] Creating run for vehicle: ${normalizedVehicle}, mobile: ${normalizedMobile}`);

    // Auto-fetch chassis and engine last 4 digits from RC API
    const { chassisLast4, engineLast4 } = await fetchRcDetails(normalizedVehicle);

    const payload = buildCreateRunPayload({
      vehicleNumber: normalizedVehicle,
      mobileNumber: normalizedMobile,
      chassisNumber: chassisLast4,
      engineNumber: engineLast4
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

    // Cache RC details for this run so SUBMIT_MOBILE can reuse them
    if (envelope.runId) {
      runRcCache.set(envelope.runId, { chassisLast4, engineLast4, vehicleNumber: normalizedVehicle });
      // Auto-cleanup after 10 minutes
      setTimeout(() => runRcCache.delete(envelope.runId), 10 * 60 * 1000);
    }

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
    const pollResult = attachChallengeActions(buildRunPollResult(runId, data.data || {}, data.message, envelope), envelope);

    if (pollResult.status === 'COMPLETED') {
      await syncCompletedRunChallans(data.data || {}, envelope);
    }

    return res.json(pollResult);

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

    // For SUBMIT_MOBILE, auto-inject cached RC details (chassis/engine last 4)
    let enrichedPayload = payload || {};
    if (action === 'SUBMIT_MOBILE') {
      const cached = runRcCache.get(runId);
      if (cached) {
        console.log(`[DelhiOTP] Injecting cached RC details for run ${runId}: chassis=${cached.chassisLast4}, engine=${cached.engineLast4}`);
        enrichedPayload = {
          ...enrichedPayload,
          chassisLast4: cached.chassisLast4,
          engineLast4: cached.engineLast4
        };
      } else if (enrichedPayload.vehicleNumber) {
        // Fallback: re-fetch from RC API if client sent vehicleNumber
        console.log(`[DelhiOTP] Cache miss for run ${runId}, re-fetching RC details`);
        const rcDetails = await fetchRcDetails(normalizeVehicleNumber(enrichedPayload.vehicleNumber));
        enrichedPayload = {
          ...enrichedPayload,
          chassisLast4: rcDetails.chassisLast4,
          engineLast4: rcDetails.engineLast4
        };
      }

      if (!enrichedPayload.chassisLast4 || !isValidLastFourDigits(enrichedPayload.chassisLast4)) {
        return res.status(400).json({
          success: false,
          message: 'Could not fetch chassis number from RC records. Please verify the vehicle number and try again.'
        });
      }
    }

    const requestBody = buildActionRequestBody(action, enrichedPayload);

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
    const pollResult = attachChallengeActions(
      buildRunPollResult(runId, data.data || {}, data.message || 'Action submitted successfully', envelope),
      envelope
    );

    if (pollResult.status === 'COMPLETED') {
      await syncCompletedRunChallans(data.data || {}, envelope);
    }

    return res.json(pollResult);

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
