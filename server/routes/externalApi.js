import express from 'express';
import { logChallanSearch } from '../utils/searchLogger.js';
import { syncRawChallans } from '../utils/challanSync.js';

const router = express.Router();

// APIClub — used for RC / vehicle info
const APICLUB_BASE_URL = 'https://prod.apiclub.in/api/v1';
const APICLUB_API_KEY = process.env.APICLUB_API_KEY || 'apclb_hYzvq3Wp24xEFExS8M9Mgkg9412fd0db';

// ChallanWala — used for challan lookup
const CHALLANWALA_API_URL = 'https://api.challanwala.com/api/v1/corporate-api/challan-lookup';
const CHALLANWALA_TOKEN = process.env.CHALLANWALA_TOKEN || 'cw_3a0583236101a82574b7410d99706b5057da7f10ebf34091e62dd5865ffab6e22e1a1eb3d2d0619ceea703f434a6832c696e23092b94f4b3a0339296584e4601';

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
        const { vehicleNumber } = req.body;

        if (!vehicleNumber) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle number is required'
            });
        }

        const normalizedVehicleNumber = vehicleNumber.replace(/[\s-]/g, '').toUpperCase();

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

        // Persist real challans to database for admin panel
        try {
            await syncRawChallans(normalizedVehicleNumber, allRaw, 'external');
        } catch (syncErr) {
            console.error('[ChallanWala] Sync to DB failed:', syncErr.message);
        }

        console.log(`[ChallanWala] Challan info fetched successfully for: ${normalizedVehicleNumber}`);

        logChallanSearch(req, {
            vehicleNumber: normalizedVehicleNumber,
            searchType: 'ALL_CHALLANS',
            status: challansFound > 0 ? 'success' : 'no_results',
            challansFound,
            responseTimeMs
        });

        return res.json({
            success: true,
            source: 'CHALLANWALA',
            vehicleNumber: normalizedVehicleNumber,
            message: data.message,
            data: data.data
        });

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
