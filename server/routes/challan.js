import express from 'express';
import VehicleModel from '../models/Vehicle.js';
import ChallanModel from '../models/Challan.js';

const router = express.Router();

// Get challans by vehicle number
router.get('/:vehicleNumber', async (req, res) => {
  const { vehicleNumber } = req.params;
  const normalizedNumber = vehicleNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');

  console.log(`📋 Fetching challans for: ${vehicleNumber}`);

  try {
    const vehicles = await VehicleModel.find();

    const vehicle = vehicles?.find(v =>
      v.vehicle_number.replace(/[^A-Z0-9]/g, '').toUpperCase() === normalizedNumber
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'No vehicle found with this number. Try: MH-12-AB-1234, KA-01-MJ-2023, or DL-05-CX-4567'
      });
    }

    const challans = await ChallanModel.find({ vehicle_id: vehicle._id }).sort({ fine_date: -1 });

    console.log(`✅ Found ${challans?.length || 0} challans for ${vehicleNumber}`);

    const vehicleResponse = {
      id: vehicle._id.toString(),
      number: vehicle.vehicle_number,
      type: vehicle.vehicle_type,
      owner: maskName(vehicle.owner_name),
      vehicleType: vehicle.vehicle_type === 'Bike' ? 'Two Wheeler' : 'Private Vehicle',
      isVerified: true,
      image: vehicle.image_url || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=100&h=60&fit=crop'
    };

    const challansResponse = (challans || []).map(c => ({
      id: c.challan_number,
      dbId: c._id.toString(),
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
      dataSource: 'MONGODB',
      vehicle: vehicleResponse,
      challans: challansResponse,
      pendingCount: challansResponse.filter(c => c.status !== 'PAID').length
    });

  } catch (error) {
    console.error('Fetch challans error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

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
