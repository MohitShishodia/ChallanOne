import express from 'express';

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

// New Challan Plus API configuration
const KASHI_DIGITAL_API_URL = 'https://core.kashidigitalapis.com/v1/challan-plus';
const KASHI_ACCESS_TOKEN = '04639b9c30e85373631e64612510a210:6da58aa12d7df097a5dfbfefecdb6343';

/**
 * GET /api/external/challan/:vehicleNumber
 * Fetch challan information from Kashi Digital APIs
 * Uses the new challan-plus endpoint with rcNumber
 */
router.get('/challan/:vehicleNumber', async (req, res) => {
    try {
        const { vehicleNumber } = req.params;

        if (!vehicleNumber) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle number is required'
            });
        }

        const normalizedVehicleNumber = vehicleNumber.replace(/[\s-]/g, '').toUpperCase();

        console.log(`📋 [External API] Fetching challan info for: ${vehicleNumber}`);
        console.log(`🔍 [External API] Calling Kashi Digital challan-plus API...`);

        // Call the new challan-plus API
        const challanResponse = await fetch(KASHI_DIGITAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accessToken': KASHI_ACCESS_TOKEN
            },
            body: JSON.stringify({
                rcNumber: normalizedVehicleNumber
            })
        });

        const challanData = await challanResponse.json();

        if (!challanData || challanData.error || challanData.status === 'error') {
            console.error('[External API] Challan API error:', challanData?.message);
            return res.status(404).json({
                success: false,
                message: challanData?.message || 'Failed to fetch challan information',
                externalResponse: challanData
            });
        }

        console.log(`✅ [External API] Challan info fetched successfully for: ${vehicleNumber}`);

        return res.json({
            success: true,
            source: 'KASHI_DIGITAL',
            vehicleNumber: normalizedVehicleNumber,
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
