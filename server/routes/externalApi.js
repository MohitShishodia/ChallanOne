import express from 'express';
import { logChallanSearch } from '../utils/searchLogger.js';
import { syncRawChallans } from '../utils/challanSync.js';

const router = express.Router();

// APIClub — used for RC / vehicle info
const APICLUB_BASE_URL = 'https://prod.apiclub.in/api/v1';
const APICLUB_API_KEY = process.env.APICLUB_API_KEY || '';

// ChallanWala — used for challan lookup
const CHALLANWALA_API_URL = 'https://api.challanwala.com/api/v1/corporate-api/challan-lookup';
const CHALLANWALA_TOKEN = process.env.CHALLANWALA_TOKEN || '';

/** Short-lived in-memory cache so repeat searches feel instant */
const CHALLAN_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes
const challanResponseCache = new Map();

function getCachedChallan(vehicleNumber) {
  const entry = challanResponseCache.get(vehicleNumber);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CHALLAN_CACHE_TTL_MS) {
    challanResponseCache.delete(vehicleNumber);
    return null;
  }
  return entry.payload;
}

function setCachedChallan(vehicleNumber, payload) {
  challanResponseCache.set(vehicleNumber, { payload, cachedAt: Date.now() });
  // Cap cache size
  if (challanResponseCache.size > 100) {
    const oldestKey = challanResponseCache.keys().next().value;
    challanResponseCache.delete(oldestKey);
  }
}

/**
 * GET /api/external/vehicle/:vehicleNumber
 * Fetch vehicle RC details from APIClub rc_info endpoint.
 */
router.get('/vehicle/:vehicleNumber', async (req, res) => {
    try {
        const { vehicleNumber } = req.params;

        if (!vehicleNumber) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle number is required'
            });
        }

        const normalizedVehicleNumber = vehicleNumber.replace(/[\s-]/g, '').toUpperCase();

        console.log(`[APIClub] Fetching vehicle info for: ${normalizedVehicleNumber}`);

        const response = await fetch(`${APICLUB_BASE_URL}/rc_info`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': APICLUB_API_KEY
            },
            body: JSON.stringify({
                vehicleId: normalizedVehicleNumber
            })
        });

        const data = await response.json();

        if (!data || data.error || data.status === 'error') {
            console.error('APIClub error:', data?.message || data?.error || 'Unknown error');
            return res.status(404).json({
                success: false,
                message: data?.message || 'Vehicle not found or external API error',
                externalResponse: data
            });
        }

        console.log(`[APIClub] Vehicle info fetched successfully for: ${normalizedVehicleNumber}`);

        return res.json({
            success: true,
            source: 'APICLUB_EXTERNAL',
            vehicle: data
        });

    } catch (error) {
        console.error('[APIClub] Vehicle info error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch vehicle information from external API',
            error: error.message
        });
    }
});

/**
 * POST /api/external/challan
 * Fetch challan information from ChallanWala API.
 * Body: { vehicleNumber }
 */
router.post('/challan', async (req, res) => {
    try {
        const { vehicleNumber, forceRefresh } = req.body;

        if (!vehicleNumber) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle number is required'
            });
        }

        const normalizedVehicleNumber = vehicleNumber.replace(/[\s-]/g, '').toUpperCase();

        if (!forceRefresh) {
            const cached = getCachedChallan(normalizedVehicleNumber);
            if (cached) {
                console.log(`[ChallanWala] Cache hit for: ${normalizedVehicleNumber}`);
                logChallanSearch(req, {
                    vehicleNumber: normalizedVehicleNumber,
                    searchType: 'ALL_CHALLANS',
                    status: 'success',
                    challansFound:
                        (cached.data?.pendingChallans?.length || 0) +
                        (cached.data?.paidChallans?.length || 0) +
                        (cached.data?.disposedChallans?.length || 0),
                    responseTimeMs: 0,
                    metadata: { cache: true }
                });
                return res.json({ ...cached, cached: true });
            }
        }

        console.log(`[ChallanWala] Fetching challan info for: ${normalizedVehicleNumber}`);

        const startTime = Date.now();
        const response = await fetch(CHALLANWALA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CHALLANWALA_TOKEN}`
            },
            body: JSON.stringify({ rc_number: normalizedVehicleNumber })
        });

        const data = await response.json();
        const responseTimeMs = Date.now() - startTime;

        if (!data.success) {
            console.error('[ChallanWala] API error:', data.message);
            logChallanSearch(req, {
                vehicleNumber: normalizedVehicleNumber,
                searchType: 'ALL_CHALLANS',
                status: 'failed',
                responseTimeMs,
                errorMessage: data.message
            });
            return res.status(data.statusCode || 502).json({
                success: false,
                message: data.message || 'Failed to fetch challan information'
            });
        }

        const pending = data.data?.pendingChallans || [];
        const paid = data.data?.paidChallans || [];
        const disposed = data.data?.disposedChallans || [];
        const allRaw = [...pending, ...paid, ...disposed];
        const challansFound = allRaw.length;

        const payload = {
            success: true,
            source: 'CHALLANWALA',
            vehicleNumber: normalizedVehicleNumber,
            message: data.message,
            data: data.data
        };

        setCachedChallan(normalizedVehicleNumber, payload);

        // Respond immediately — sync/log in background (was blocking 60+ DB writes)
        res.json(payload);

        logChallanSearch(req, {
            vehicleNumber: normalizedVehicleNumber,
            searchType: 'ALL_CHALLANS',
            status: challansFound > 0 ? 'success' : 'no_results',
            challansFound,
            responseTimeMs
        }).catch(() => {});

        syncRawChallans(normalizedVehicleNumber, allRaw, 'external').catch((syncErr) => {
            console.error('[ChallanWala] Sync to DB failed:', syncErr.message);
        });

        console.log(`[ChallanWala] Challan info fetched in ${responseTimeMs}ms for: ${normalizedVehicleNumber}`);
        return;

    } catch (error) {
        console.error('[ChallanWala] Challan info error:', error);
        logChallanSearch(req, {
            vehicleNumber: req.body?.vehicleNumber || 'UNKNOWN',
            searchType: 'ALL_CHALLANS',
            status: 'failed',
            errorMessage: error.message
        });
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch challan information from external API',
            error: error.message
        });
    }
});

export default router;
