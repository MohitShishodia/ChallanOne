import express from 'express';
import { challanData, vehicleData } from '../data/mockData.js';

const router = express.Router();

// NOTE: RapidAPI integration disabled - API returning errors
// To enable real API, configure API Setu or working RapidAPI endpoint

// Get challans by vehicle number
router.get('/:vehicleNumber', async (req, res) => {
  const { vehicleNumber } = req.params;
  const normalizedNumber = vehicleNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  console.log(`📋 Fetching challans for: ${vehicleNumber}`);
  
  // Find vehicle info from mock data
  const vehicle = vehicleData.find(v => 
    v.number.replace(/[^A-Z0-9]/g, '').toUpperCase() === normalizedNumber
  );
  
  if (!vehicle) {
    return res.status(404).json({ 
      success: false, 
      message: 'No vehicle found with this number. Try: MH-12-AB-1234, KA-01-MJ-2023, or DL-05-CX-4567',
      dataSource: 'MOCK_DATA'
    });
  }
  
  // Find challans for this vehicle
  const challans = challanData.filter(c => 
    c.vehicleNumber.replace(/[^A-Z0-9]/g, '').toUpperCase() === normalizedNumber
  );
  
  console.log(`✅ Found ${challans.length} challans for ${vehicleNumber}`);
  
  res.json({
    success: true,
    dataSource: 'MOCK_DATA',
    vehicle,
    challans,
    pendingCount: challans.filter(c => c.status !== 'PAID').length
  });
});

// Pay challans (placeholder)
router.post('/pay', (req, res) => {
  const { challanIds, vehicleNumber } = req.body;
  
  res.json({
    success: true,
    message: 'Payment gateway integration pending',
    transactionId: `TXN-${Date.now()}`,
    challanIds
  });
});

export default router;
