import express from 'express';
import VehicleModel from '../models/Vehicle.js';
import ChallanModel from '../models/Challan.js';

const router = express.Router();

// Get vehicle information by vehicle number
router.get('/:vehicleNumber', async (req, res) => {
  try {
    const { vehicleNumber } = req.params;
    if (!vehicleNumber) return res.status(400).json({ success: false, message: 'Vehicle number is required' });

    const normalizedNumber = vehicleNumber.replace(/[\s-]/g, '').toUpperCase();
    console.log(`🚗 Fetching vehicle info for: ${vehicleNumber}`);

    // Build a regex to loosely match vehicle number
    const prefix = normalizedNumber.slice(0, 2);
    const suffix = normalizedNumber.slice(-4);
    const vehicles = await VehicleModel.find({
      vehicle_number: { $regex: new RegExp(`${prefix}.*${suffix}`, 'i') }
    });

    const vehicle = vehicles?.find(v =>
      v.vehicle_number.replace(/[\s-]/g, '').toUpperCase() === normalizedNumber
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found. Please check the vehicle number and try again.'
      });
    }

    const unpaidCount = await ChallanModel.countDocuments({
      vehicle_id: vehicle._id,
      status: { $in: ['PENDING', 'OVERDUE'] }
    });

    console.log(`✅ Found vehicle: ${vehicle.vehicle_number} with ${unpaidCount} unpaid challans`);

    const vehicleResponse = {
      id: vehicle._id.toString(),
      number: vehicle.vehicle_number,
      type: vehicle.vehicle_type,
      owner: maskName(vehicle.owner_name),
      ownerFull: vehicle.owner_name,
      vehicleType: vehicle.vehicle_type === 'Bike' ? 'Two Wheeler' : 'Private Vehicle',
      isVerified: true,
      image: vehicle.image_url || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=100&h=60&fit=crop',
      ownershipType: 'First Owner',
      model: vehicle.model,
      manufacturer: vehicle.manufacturer,
      color: vehicle.color,
      fuelType: vehicle.fuel_type,
      engineNumber: vehicle.engine_number,
      chassisNumber: vehicle.chassis_number,
      registrationDate: formatDate(vehicle.registration_date),
      registrationAuthority: 'RTO',
      fitnessValidUpto: calculateFitness(vehicle.registration_date),
      pucValidUpto: '20 Jun 2024',
      taxValidUpto: calculateTax(vehicle.registration_date),
      insuranceExpiry: formatDate(vehicle.insurance_expiry),
      insuranceStatus: vehicle.insurance_status || 'active',
      unpaidChallanCount: unpaidCount,
      seatingCapacity: vehicle.vehicle_type === 'Bike' ? 2 : 5,
      vehicleClass: vehicle.vehicle_type === 'Bike' ? 'Motor Cycle/Scooter (2WN)' : 'Motor Car (LMV)',
      bodyType: vehicle.vehicle_type === 'Bike' ? 'SCOOTER' : 'HATCHBACK',
      hypothecation: null, hypothecationValidUpto: null, nocDetails: null, blacklistStatus: false,
      rcStatus: vehicle.rc_status || 'ACTIVE'
    };

    return res.json({ success: true, vehicle: vehicleResponse });
  } catch (error) {
    console.error('Get vehicle info error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

function maskName(name) {
  if (!name) return 'Unknown';
  return name.split(' ').map(p => p[0] + '***').join(' ');
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function calculateFitness(regDate) {
  if (!regDate) return 'N/A';
  const date = new Date(regDate);
  date.setFullYear(date.getFullYear() + 15);
  return formatDate(date);
}

function calculateTax(regDate) {
  if (!regDate) return 'N/A';
  const date = new Date(regDate);
  date.setFullYear(date.getFullYear() + 5);
  return formatDate(date);
}

export default router;
