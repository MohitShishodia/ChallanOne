import express from 'express';
import { adminAuth } from '../../middleware/adminAuth.js';
import { requirePermission, PERMISSIONS } from '../../middleware/rbac.js';
import ChallanSearchModel from '../../models/ChallanSearch.js';
import UserModel from '../../models/User.js';

const router = express.Router();

/**
 * GET /api/admin/api-usage/stats
 * Get aggregated API usage statistics
 */
router.get('/stats', adminAuth, requirePermission(PERMISSIONS.VIEW_DASHBOARD), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalCalls, todayCalls, byType, byUser, rateLimitedCalls] = await Promise.all([
      ChallanSearchModel.countDocuments(),
      ChallanSearchModel.countDocuments({ created_at: { $gte: today } }),
      ChallanSearchModel.aggregate([
        { $group: { _id: '$search_type', count: { $sum: 1 } } }
      ]),
      ChallanSearchModel.aggregate([
        { $match: { user_id: { $ne: null } } },
        { $group: { _id: '$user_id', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]),
      ChallanSearchModel.countDocuments({ 
        $or: [
          { error_message: { $regex: 'rate limit|limit exceeded|Daily.*limit', $options: 'i' } },
          { metadata: { $regex: 'rate limit|limit exceeded', $options: 'i' } }
        ]
      })
    ]);

    const typeStats = {};
    for (const t of byType) typeStats[t._id] = t.count;

    // Get user details for top users
    const userIds = byUser.map(u => u._id);
    const users = await UserModel.find({ _id: { $in: userIds } }, 'email name phone').lean();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = { email: u.email, name: u.name, phone: u.phone }; });

    const topUsers = byUser.map(u => ({
      userId: u._id.toString(),
      callCount: u.count,
      ...userMap[u._id.toString()]
    }));

    return res.json({
      success: true,
      stats: {
        totalCalls,
        todayCalls,
        byType: typeStats,
        rateLimitedCalls,
        topUsers
      }
    });
  } catch (error) {
    console.error('API usage stats error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/api-usage/user/:userId
 * Get API usage for a specific user
 */
router.get('/user/:userId', adminAuth, requirePermission(PERMISSIONS.VIEW_USERS), async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 30, search_type, status, dateFrom, dateTo } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit) || 30, 100);

    const filter = { user_id: userId };
    if (search_type) filter.search_type = search_type;
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.created_at = {};
      if (dateFrom) filter.created_at.$gte = new Date(dateFrom);
      if (dateTo) filter.created_at.$lte = new Date(dateTo);
    }

    const [logs, total, user] = await Promise.all([
      ChallanSearchModel.find(filter)
        .sort({ created_at: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      ChallanSearchModel.countDocuments(filter),
      UserModel.findById(userId).select('email name phone created_at').lean()
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get today's RC details count for rate limit status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRcCalls = await ChallanSearchModel.countDocuments({
      user_id: userId,
      search_type: 'RC_DETAILS',
      created_at: { $gte: today }
    });

    return res.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone,
        createdAt: user.created_at
      },
      rateLimitStatus: {
        rcDetailsToday: todayRcCalls,
        rcDetailsLimit: 10,
        rcDetailsRemaining: Math.max(0, 10 - todayRcCalls)
      },
      logs: logs.map(s => ({
        id: s._id.toString(),
        vehicleNumber: s.vehicle_number,
        searchType: s.search_type,
        status: s.status,
        challansFound: s.challans_found,
        responseTimeMs: s.response_time_ms,
        errorMessage: s.error_message,
        ipAddress: s.ip_address,
        createdAt: s.created_at
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get user API usage error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/api-usage/rc-details-logs
 * Get all RC Details logs with filtering
 */
router.get('/rc-details-logs', adminAuth, requirePermission(PERMISSIONS.VIEW_DASHBOARD), async (req, res) => {
  try {
    const { page = 1, limit = 30, status, vehicle, dateFrom, dateTo, userId } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit) || 30, 100);

    const filter = { search_type: 'RC_DETAILS' };
    if (status) filter.status = status;
    if (vehicle) filter.vehicle_number = { $regex: vehicle, $options: 'i' };
    if (userId) filter.user_id = userId;
    if (dateFrom || dateTo) {
      filter.created_at = {};
      if (dateFrom) filter.created_at.$gte = new Date(dateFrom);
      if (dateTo) filter.created_at.$lte = new Date(dateTo);
    }

    const [logs, total] = await Promise.all([
      ChallanSearchModel.find(filter)
        .sort({ created_at: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      ChallanSearchModel.countDocuments(filter)
    ]);

    // Get user details for these logs
    const userIds = [...new Set(logs.map(l => l.user_id).filter(Boolean))];
    const users = await UserModel.find({ _id: { $in: userIds } }, 'email name phone').lean();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = { email: u.email, name: u.name, phone: u.phone }; });

    return res.json({
      success: true,
      logs: logs.map(s => ({
        id: s._id.toString(),
        vehicleNumber: s.vehicle_number,
        searchType: s.search_type,
        status: s.status,
        challansFound: s.challans_found,
        responseTimeMs: s.response_time_ms,
        errorMessage: s.error_message,
        ipAddress: s.ip_address,
        user: s.user_id ? userMap[s.user_id.toString()] || { id: s.user_id.toString() } : null,
        createdAt: s.created_at
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get RC details logs error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/api-usage/challan-logs
 * Get all Challan API logs with filtering
 */
router.get('/challan-logs', adminAuth, requirePermission(PERMISSIONS.VIEW_DASHBOARD), async (req, res) => {
  try {
    const { page = 1, limit = 30, status, vehicle, dateFrom, dateTo, userId } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit) || 30, 100);

    const filter = { search_type: { $in: ['ALL_CHALLANS', 'DELHI_OTP', 'DB_LOOKUP'] } };
    if (status) filter.status = status;
    if (vehicle) filter.vehicle_number = { $regex: vehicle, $options: 'i' };
    if (userId) filter.user_id = userId;
    if (dateFrom || dateTo) {
      filter.created_at = {};
      if (dateFrom) filter.created_at.$gte = new Date(dateFrom);
      if (dateTo) filter.created_at.$lte = new Date(dateTo);
    }

    const [logs, total] = await Promise.all([
      ChallanSearchModel.find(filter)
        .sort({ created_at: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      ChallanSearchModel.countDocuments(filter)
    ]);

    // Get user details for these logs
    const userIds = [...new Set(logs.map(l => l.user_id).filter(Boolean))];
    const users = await UserModel.find({ _id: { $in: userIds } }, 'email name phone').lean();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = { email: u.email, name: u.name, phone: u.phone }; });

    return res.json({
      success: true,
      logs: logs.map(s => ({
        id: s._id.toString(),
        vehicleNumber: s.vehicle_number,
        searchType: s.search_type,
        status: s.status,
        challansFound: s.challans_found,
        responseTimeMs: s.response_time_ms,
        errorMessage: s.error_message,
        ipAddress: s.ip_address,
        user: s.user_id ? userMap[s.user_id.toString()] || { id: s.user_id.toString() } : null,
        createdAt: s.created_at
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get challan logs error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/api-usage/daily-breakdown
 * Get daily breakdown of API calls
 */
router.get('/daily-breakdown', adminAuth, requirePermission(PERMISSIONS.VIEW_DASHBOARD), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = Math.min(parseInt(days) || 30, 90);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);
    startDate.setHours(0, 0, 0, 0);

    const breakdown = await ChallanSearchModel.aggregate([
      { $match: { created_at: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
            searchType: '$search_type',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Organize by date
    const byDate = {};
    for (const item of breakdown) {
      const date = item._id.date;
      if (!byDate[date]) byDate[date] = { date, RC_DETAILS: 0, ALL_CHALLANS: 0, DELHI_OTP: 0, DB_LOOKUP: 0, failed: 0, rateLimited: 0 };
      byDate[date][item._id.searchType] = (byDate[date][item._id.searchType] || 0) + item.count;
      if (item._id.status === 'failed') byDate[date].failed += item.count;
      if (item._id.status === 'rate_limited') byDate[date].rateLimited += item.count;
    }

    const data = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Daily breakdown error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;