import express from 'express';
import { vehicleData, challanData } from '../data/mockData.js';

const router = express.Router();

// Get vehicle information by vehicle number
router.get('/:vehicleNumber', (req, res) => {
  try {
    const { vehicleNumber } = req.params;
    
    if (!vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle number is required'
      });
    }
    
    // Normalize vehicle number (remove spaces and convert to uppercase)
    const normalizedNumber = vehicleNumber.replace(/\s+/g, '').toUpperCase();
    
    // Find vehicle in mock data
    const vehicle = vehicleData.find(v => 
      v.number.replace(/\s+/g, '').replace(/-/g, '').toUpperCase() === 
      normalizedNumber.replace(/-/g, '')
    );
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found. Please check the vehicle number and try again.'
      });
    }
    
    // Count unpaid challans for this vehicle
    const unpaidChallans = challanData.filter(
      c => c.vehicleNumber === vehicle.number && 
      (c.status === 'PENDING' || c.status === 'OVERDUE')
    );
    
    // Return vehicle data with updated challan count
    return res.json({
      success: true,
      vehicle: {
        ...vehicle,
        unpaidChallanCount: unpaidChallans.length > 0 ? unpaidChallans.length : vehicle.unpaidChallanCount
      }
    });
  } catch (error) {
    console.error('Get vehicle info error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
