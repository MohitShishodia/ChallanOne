import express from 'express';
import { adminAuth } from '../../middleware/adminAuth.js';
import { requirePermission, PERMISSIONS } from '../../middleware/rbac.js';
import ChallanSearchModel from '../../models/ChallanSearch.js';

const router = express.Router();

/**
 * GET /api/admin/challan-searches
 * View all user challan search activity.
 */
router.get('/', adminAuth, requirePermission(PERMISSIONS.VIEW_DASHBOARD), async (req, res) => {
  try {
    const { page = 1, limit = 30, search_type, status, vehicle, dateFrom, dateTo } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit) || 30, 100);

    const filter = {};
    if (search_type) filter.search_type = search_type;
    if (status) filter.status = status;
    if (vehicle) filter.vehicle_number = { $regex: vehicle, $options: 'i' };
    if (dateFrom || dateTo) {
      filter.created_at = {};
      if (dateFrom) filter.created_at.$gte = new Date(dateFrom);
      if (dateTo) filter.created_at.$lte = new Date(dateTo);
    }

    const [searches, total] = await Promise.all([
      ChallanSearchModel.find(filter)
        .sort({ created_at: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      ChallanSearchModel.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      searches: searches.map(s => ({
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
    console.error('Get challan searches error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/challan-searches/stats
 * Aggregated stats about searches.
 */
router.get('/stats', adminAuth, requirePermission(PERMISSIONS.VIEW_DASHBOARD), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalSearches, todaySearches, byType, recentFailed] = await Promise.all([
      ChallanSearchModel.countDocuments(),
      ChallanSearchModel.countDocuments({ created_at: { $gte: today } }),
      ChallanSearchModel.aggregate([
        { $group: { _id: '$search_type', count: { $sum: 1 } } }
      ]),
      ChallanSearchModel.countDocuments({ status: 'failed' })
    ]);

    const typeStats = {};
    for (const t of byType) typeStats[t._id] = t.count;

    return res.json({
      success: true,
      stats: {
        totalSearches,
        todaySearches,
        byType: typeStats,
        failedSearches: recentFailed
      }
    });
  } catch (error) {
    console.error('Challan search stats error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
