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

/**
 * GET /api/external/challan/:vehicleNumber
 * Fetch challan information from external APIClub API
 * First fetches vehicle info to get chassis_number and engine_number,
 * then calls challan API with all required fields
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

        // Step 1: Fetch vehicle info to get chassis_number and engine_number
        console.log(`🔍 [External API] Step 1: Fetching vehicle details first...`);

        const vehicleData = await fetchVehicleInfoFromExternal(normalizedVehicleNumber);

        if (!vehicleData || vehicleData.error || vehicleData.status === 'error') {
            console.error('[External API] Failed to fetch vehicle info:', vehicleData?.message);
            return res.status(404).json({
                success: false,
                message: 'Could not fetch vehicle information. Vehicle number may be invalid.',
                externalResponse: vehicleData
            });
        }

        // Extract chassis_number and engine_number from vehicle response
        // The data is nested under response object from APIClub
        const responseData = vehicleData.response || vehicleData.result || vehicleData;
        const chassisNumber = responseData.chassis_number || responseData.chassisNumber;
        const engineNumber = responseData.engine_number || responseData.engineNumber;

        if (!chassisNumber || !engineNumber) {
            console.error('[External API] Missing chassis_number or engine_number in vehicle data');
            return res.status(400).json({
                success: false,
                message: 'Could not extract chassis number or engine number from vehicle data',
                vehicleData: vehicleData
            });
        }

        console.log(`✅ [External API] Got chassis: ${chassisNumber.substring(0, 4)}***, engine: ${engineNumber.substring(0, 4)}***`);

        // Step 2: Call challan API with all required fields
        console.log(`🔍 [External API] Step 2: Fetching challan details...`);

        const challanResponse = await fetch(`${APICLUB_BASE_URL}/challan_info_v2`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': APICLUB_API_KEY
            },
            body: JSON.stringify({
                vehicleId: normalizedVehicleNumber,
                chassis: chassisNumber,
                engine_no: engineNumber
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
            source: 'APICLUB_EXTERNAL',
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
