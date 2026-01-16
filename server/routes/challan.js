import express from 'express';
import supabase from '../config/supabase.js';

const router = express.Router();

// Get challans by vehicle number
router.get('/:vehicleNumber', async (req, res) => {
  const { vehicleNumber } = req.params;
  const normalizedNumber = vehicleNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');

  console.log(`📋 Fetching challans for: ${vehicleNumber}`);

  try {
    // First find the vehicle
    const { data: vehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*');

    if (vehicleError) {
      console.error('Supabase vehicle error:', vehicleError);
      return res.status(500).json({
        success: false,
        message: 'Database error occurred'
      });
    }

    // Find matching vehicle
    const vehicle = vehicles?.find(v =>
      v.vehicle_number.replace(/[^A-Z0-9]/g, '').toUpperCase() === normalizedNumber
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'No vehicle found with this number. Try: MH-12-AB-1234, KA-01-MJ-2023, or DL-05-CX-4567'
      });
    }

    // Get challans for this vehicle
    const { data: challans, error: challanError } = await supabase
      .from('challans')
      .select('*')
      .eq('vehicle_id', vehicle.id)
      .order('fine_date', { ascending: false });

    if (challanError) {
      console.error('Supabase challan error:', challanError);
      return res.status(500).json({
        success: false,
        message: 'Database error occurred'
      });
    }

    console.log(`✅ Found ${challans?.length || 0} challans for ${vehicleNumber}`);

    // Transform vehicle data
    const vehicleResponse = {
      id: vehicle.id,
      number: vehicle.vehicle_number,
      type: vehicle.vehicle_type,
      owner: maskName(vehicle.owner_name),
      vehicleType: vehicle.vehicle_type === 'Bike' ? 'Two Wheeler' : 'Private Vehicle',
      isVerified: true,
      image: vehicle.image_url || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=100&h=60&fit=crop'
    };

    // Transform challans data
    const challansResponse = (challans || []).map(c => ({
      id: c.challan_number,
      dbId: c.id,
      vehicleNumber: vehicle.vehicle_number,
      type: c.violation_type,
      description: c.description,
      amount: parseFloat(c.amount),
      status: c.status,
      date: formatDate(c.fine_date),
      time: formatTime(c.fine_time),
      location: c.location,
      proofImage: c.proof_image_url || 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=300&fit=crop'
    }));

    res.json({
      success: true,
      dataSource: 'SUPABASE',
      vehicle: vehicleResponse,
      challans: challansResponse,
      pendingCount: challansResponse.filter(c => c.status !== 'PAID').length
    });

  } catch (error) {
    console.error('Fetch challans error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper functions
function maskName(name) {
  if (!name) return 'Unknown';
  const parts = name.split(' ');
  return parts.map(p => p[0] + '***').join(' ');
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '00:00';
  return timeStr.substring(0, 5);
}

export default router;
