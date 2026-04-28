// Admin user management routes
import express from 'express';
import { adminAuth } from '../../middleware/adminAuth.js';
import { requirePermission, PERMISSIONS } from '../../middleware/rbac.js';
import { logActivity } from '../../data/activityLog.js';
import UserModel from '../../models/User.js';
import PaymentModel from '../../models/Payment.js';
import ReceiptModel from '../../models/Receipt.js';

const router = express.Router();

// GET /api/admin/users
router.get('/', adminAuth, requirePermission(PERMISSIONS.VIEW_USERS), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, sort = 'created_at', order = 'desc' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const filter = {};
    if (search) filter.$or = [
      { email: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
    if (status) filter.status = status;

    const sortDir = order === 'asc' ? 1 : -1;
    const sortObj = { [sort]: sortDir };

    const [users, total] = await Promise.all([
      UserModel.find(filter).select('-password_hash').sort(sortObj).skip((pageNum - 1) * limitNum).limit(limitNum),
      UserModel.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      users: users.map(u => ({
        id: u._id.toString(), email: u.email, name: u.name, phone: u.phone,
        status: u.status || 'active', createdAt: u.created_at, lastLogin: u.last_login
      })),
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/users/:id
router.get('/:id', adminAuth, requirePermission(PERMISSIONS.VIEW_USERS), async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id).select('-password_hash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [payments, receipts] = await Promise.all([
      PaymentModel.find({ vehicle_number: user.vehicle_number || '' }).sort({ paid_at: -1 }).limit(10),
      ReceiptModel.find().sort({ payment_date: -1 }).limit(10)
    ]);

    return res.json({
      success: true,
      user: {
        id: user._id.toString(), email: user.email, name: user.name, phone: user.phone,
        status: user.status || 'active', createdAt: user.created_at, lastLogin: user.last_login
      },
      payments: payments || [],
      receipts: receipts || []
    });
  } catch (error) {
    console.error('Get user detail error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PATCH /api/admin/users/:id/status
router.patch('/:id/status', adminAuth, requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be active or inactive' });
    }

    const user = await UserModel.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('id email name status');
    if (!user) return res.status(500).json({ success: false, message: 'Failed to update user status' });

    await logActivity(req.admin.id, `user_${status}`, 'user', req.params.id, { email: user.email });

    return res.json({
      success: true,
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/users/:id/activity
router.get('/:id/activity', adminAuth, requirePermission(PERMISSIONS.VIEW_USERS), async (req, res) => {
  try {
    const receipts = await ReceiptModel.find().sort({ payment_date: -1 }).limit(50);
    return res.json({ success: true, activity: receipts || [] });
  } catch (error) {
    console.error('Get user activity error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
