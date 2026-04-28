// Admin challan management routes
import express from 'express';
import { adminAuth } from '../../middleware/adminAuth.js';
import { requirePermission, PERMISSIONS } from '../../middleware/rbac.js';
import { logActivity } from '../../data/activityLog.js';
import ChallanModel from '../../models/Challan.js';

const router = express.Router();

// GET /api/admin/challans/stats  (must come before /:id)
router.get('/stats', adminAuth, requirePermission(PERMISSIONS.VIEW_CHALLANS), async (req, res) => {
  try {
    const challans = await ChallanModel.find({}, 'status amount');
    const stats = { total: 0, pending: 0, overdue: 0, paid: 0, totalFineAmount: 0, collectedAmount: 0 };

    (challans || []).forEach(c => {
      stats.total++;
      const amount = parseFloat(c.amount) || 0;
      stats.totalFineAmount += amount;
      switch (c.status) {
        case 'PENDING': stats.pending++; break;
        case 'OVERDUE': stats.overdue++; break;
        case 'PAID': stats.paid++; stats.collectedAmount += amount; break;
      }
    });

    return res.json({ success: true, stats });
  } catch (error) {
    console.error('Challan stats error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/challans
router.get('/', adminAuth, requirePermission(PERMISSIONS.VIEW_CHALLANS), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, dateFrom, dateTo, sort = 'fine_date', order = 'desc' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const filter = {};
    if (status) filter.status = status;
    if (search) filter.$or = [
      { challan_number: { $regex: search, $options: 'i' } },
      { violation_type: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } }
    ];
    if (dateFrom || dateTo) {
      filter.fine_date = {};
      if (dateFrom) filter.fine_date.$gte = dateFrom;
      if (dateTo) filter.fine_date.$lte = dateTo;
    }

    const sortDir = order === 'asc' ? 1 : -1;
    const [challans, total] = await Promise.all([
      ChallanModel.find(filter).populate('vehicle_id', 'vehicle_number owner_name vehicle_type')
        .sort({ [sort]: sortDir }).skip((pageNum - 1) * limitNum).limit(limitNum),
      ChallanModel.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      challans: (challans || []).map(c => ({
        id: c._id.toString(),
        challanNumber: c.challan_number,
        vehicleNumber: c.vehicle_id?.vehicle_number || 'N/A',
        ownerName: c.vehicle_id?.owner_name || 'N/A',
        vehicleType: c.vehicle_id?.vehicle_type || 'N/A',
        violationType: c.violation_type,
        description: c.description,
        amount: parseFloat(c.amount),
        status: c.status,
        fineDate: c.fine_date,
        fineTime: c.fine_time,
        location: c.location,
        issuedBy: c.issued_by
      })),
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Get challans error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/challans/:id
router.get('/:id', adminAuth, requirePermission(PERMISSIONS.VIEW_CHALLANS), async (req, res) => {
  try {
    const challan = await ChallanModel.findById(req.params.id).populate('vehicle_id');
    if (!challan) return res.status(404).json({ success: false, message: 'Challan not found' });

    return res.json({
      success: true,
      challan: {
        id: challan._id.toString(),
        challanNumber: challan.challan_number,
        vehicle: challan.vehicle_id,
        violationType: challan.violation_type,
        description: challan.description,
        amount: parseFloat(challan.amount),
        status: challan.status,
        fineDate: challan.fine_date,
        fineTime: challan.fine_time,
        location: challan.location,
        issuedBy: challan.issued_by,
        proofImage: challan.proof_image_url
      }
    });
  } catch (error) {
    console.error('Get challan error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PATCH /api/admin/challans/:id/status
router.patch('/:id/status', adminAuth, requirePermission(PERMISSIONS.MANAGE_CHALLANS), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['PENDING', 'OVERDUE', 'PAID', 'RESOLVED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const challan = await ChallanModel.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    ).select('id challan_number status');

    if (!challan) return res.status(500).json({ success: false, message: 'Failed to update challan status' });

    await logActivity(req.admin.id, 'challan_status_update', 'challan', req.params.id, {
      challanNumber: challan.challan_number, newStatus: status
    });

    return res.json({ success: true, message: `Challan status updated to ${status}`, challan });
  } catch (error) {
    console.error('Update challan status error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
