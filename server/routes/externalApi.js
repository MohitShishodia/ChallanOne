import express from 'express';
import Vehicle from '../models/Vehicle.js';

const router = express.Router();

const APICLUB_BASE_URL = 'https://prod.apiclub.in/api/v1';
const APICLUB_API_KEY = process.env.APICLUB_API_KEY || 'apclb_hYzvq3Wp24xEFExS8M9Mgkg9412fd0db';

/**
 * Fetch vehicle information from external API
 * @param {string} vehicleNumber - Vehicle registration number
 * @returns {Promise<object>} Vehicle info including chassis_number and engine_number
 */
async function fetchVehicleInfoFromExternal(vehicleNumber) {
    const response = await fetch(`${APICLUB_BASE_URL}/rc_info`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': APICLUB_API_KEY
        },
        body: JSON.stringify({
            vehicleId: vehicleNumber.replace(/[\s-]/g, '').toUpperCase()
        })
    });

    const data = await response.json();
    return data;
}

/**
 * Resolve chassis and engine number for a vehicle.
 * Priority:
 *   1. Caller-supplied values (chassis / engine_no in request body)
 *   2. Cached values in the Vehicle collection
 *   3. Live rc_info API call → result saved to DB for future requests
 *
 * @param {string} vehicleNumber  - Normalised (uppercase, no spaces) vehicle number
 * @param {string|undefined} chassisOverride  - Optional caller-supplied chassis
 * @param {string|undefined} engineOverride   - Optional caller-supplied engine number
 * @returns {{ chassis: string|null, engine_no: string|null, source: string }}
 */
async function resolveVehicleIdentifiers(vehicleNumber, chassisOverride, engineOverride) {
    let chassis = null;
    let engine_no = null;
    let source = '';

    // 1. Caller already provided both values
    if (chassisOverride?.trim() && engineOverride?.trim()) {
        chassis = chassisOverride.trim();
        engine_no = engineOverride.trim();
        source = 'request';
    }

    // 2. Check DB cache (only if not already resolved)
    if (!chassis || !engine_no) {
        const cached = await Vehicle.findOne({ vehicle_number: vehicleNumber });
        if (cached?.chassis_number && cached?.engine_number) {
            console.log(`💾 [External API] Using cached chassis/engine for: ${vehicleNumber}`);
            chassis = cached.chassis_number;
            engine_no = cached.engine_number;
            source = 'db_cache';
        }
    }

    // 3. Fetch from rc_info API if still not resolved
    if (!chassis || !engine_no) {
        console.log(`🌐 [External API] No cache found — fetching rc_info for: ${vehicleNumber}`);
        const rcData = await fetchVehicleInfoFromExternal(vehicleNumber);

        if (!rcData || rcData.error || rcData.status === 'error') {
            console.warn(`⚠️ [External API] rc_info failed for ${vehicleNumber}:`, rcData?.message);
            return { chassis: null, engine_no: null, source: 'rc_info_failed' };
        }

        // Try multiple possible response shapes (flat or nested under .response)
        const resp = rcData.response || rcData;
        chassis = resp.chassis_number || resp.chassis || null;
        engine_no = resp.engine_number || resp.engine_no || null;
        source = 'rc_info_api';
    }

    // 4. Always persist to DB so future calls are instant (upsert)
    if (chassis && engine_no) {
        await Vehicle.findOneAndUpdate(
            { vehicle_number: vehicleNumber },
            {
                $set: {
                    chassis_number: chassis,
                    engine_number:  engine_no,
                }
            },
            { upsert: true, new: true }
        );
        console.log(`✅ [External API] Chassis/engine cached to DB for: ${vehicleNumber} (source: ${source})`);
    }

    return { chassis, engine_no, source };
}

/**
 * GET /api/external/vehicle/:vehicleNumber
 * Fetch vehicle information from external APIClub API
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

        console.log(`🚗 [External API] Fetching vehicle info for: ${vehicleNumber}`);

        const data = await fetchVehicleInfoFromExternal(vehicleNumber);

        if (!data || data.error || data.status === 'error') {
            console.error('External API error:', data?.message || data?.error || 'Unknown error');
            return res.status(404).json({
                success: false,
                message: data?.message || 'Vehicle not found or external API error',
                externalResponse: data
            });
        }

        console.log(`✅ [External API] Vehicle info fetched successfully for: ${vehicleNumber}`);

        return res.json({
            success: true,
            source: 'APICLUB_EXTERNAL',
            vehicle: data
        });

    } catch (error) {
        console.error('[External API] Vehicle info error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch vehicle information from external API',
            error: error.message
        });
    }
});

/**
 * POST /api/external/challan
 * Fetch challan information from APIClub's challan_info_v2 endpoint.
 *
 * Body: { vehicleNumber, chassis?, engine_no? }
 *
 * chassis and engine_no are optional — if omitted the handler will look them
 * up from the DB cache (Vehicle collection) or call the rc_info API and cache
 * the result automatically for future requests.
 */
router.post('/challan', async (req, res) => {
    try {
        const { vehicleNumber, chassis, engine_no } = req.body;

        if (!vehicleNumber) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle number is required'
            });
        }

        const normalizedVehicleNumber = vehicleNumber.replace(/[\s-]/g, '').toUpperCase();

        console.log(`📋 [External API] Fetching challan info for: ${normalizedVehicleNumber}`);

        // ── Resolve chassis / engine number (DB cache → rc_info API) ──────────
        const identifiers = await resolveVehicleIdentifiers(
            normalizedVehicleNumber,
            chassis,
            engine_no
        );
        console.log(`🔑 [External API] Identifiers source: ${identifiers.source}`, {
            chassis: identifiers.chassis,
            engine_no: identifiers.engine_no
        });

        // ── Build challan request payload ─────────────────────────────────────
        const payload = { vehicleId: normalizedVehicleNumber };
        if (identifiers.chassis)  payload.chassis   = identifiers.chassis;
        if (identifiers.engine_no) payload.engine_no = identifiers.engine_no;

        console.log(`🔍 [External API] Calling APIClub challan_info_v2...`);

        const challanResponse = await fetch(`${APICLUB_BASE_URL}/challan_info_v2`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': APICLUB_API_KEY
            },
            body: JSON.stringify(payload)
        });

        const challanData = await challanResponse.json();

        if (!challanData || challanData.error || challanData.status === 'error') {
            console.error('[External API] Challan API error:', challanData?.message || challanData?.error);
            const upstreamStatus = challanData?.code || challanResponse.status || 502;
            return res.status(upstreamStatus).json({
                success: false,
                message: challanData?.message || 'Failed to fetch challan information',
                externalResponse: challanData
            });
        }

        console.log(`✅ [External API] Challan info fetched successfully for: ${normalizedVehicleNumber}`);

        return res.json({
            success: true,
            source: 'APICLUB',
            vehicleNumber: normalizedVehicleNumber,
            identifiersSource: identifiers.source,   // 'request' | 'db_cache' | 'rc_info_api'
            challan: challanData
        });

    } catch (error) {
        console.error('[External API] Challan info error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch challan information from external API',
            error: error.message
        });
    }
});

export default router;
