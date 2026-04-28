// Admin dashboard routes
import express from 'express';
import { adminAuth } from '../../middleware/adminAuth.js';
import { requirePermission, PERMISSIONS } from '../../middleware/rbac.js';
import { getRecentActivity } from '../../data/activityLog.js';
import UserModel from '../../models/User.js';
import PaymentModel from '../../models/Payment.js';
import ChallanModel from '../../models/Challan.js';
import ServiceModel from '../../models/Service.js';
import SupportTicketModel from '../../models/SupportTicket.js';

const router = express.Router();

// GET /api/admin/dashboard/stats
router.get('/stats', adminAuth, requirePermission(PERMISSIONS.VIEW_DASHBOARD), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, payments, pendingChallans, activeServices, openTickets, todayPayments] = await Promise.all([
      UserModel.countDocuments(),
      PaymentModel.find({}, 'total_amount status'),
      ChallanModel.countDocuments({ status: { $ne: 'PAID' } }),
      ServiceModel.countDocuments({ status: 'active' }),
      SupportTicketModel.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      PaymentModel.find({ paid_at: { $gte: today } }, 'total_amount')
    ]);

    const totalPayments = payments.length;
    const totalRevenue = payments.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);
    const todayRevenue = todayPayments.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);

    return res.json({
      success: true,
      stats: {
        totalUsers, totalPayments, totalRevenue, pendingChallans,
        activeServices, openTickets, todayRevenue, todayPayments: todayPayments.length
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
});

// GET /api/admin/dashboard/revenue-chart
router.get('/revenue-chart', adminAuth, requirePermission(PERMISSIONS.VIEW_DASHBOARD), async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const payments = await PaymentModel.find({ status: 'SUCCESS' }, 'total_amount paid_at').sort({ paid_at: 1 });

    const grouped = {};
    (payments || []).forEach(p => {
      if (!p.paid_at) return;
      const date = new Date(p.paid_at);
      let key;
      switch (period) {
        case 'daily': key = date.toISOString().split('T')[0]; break;
        case 'weekly':
          const weekStart = new Date(date); weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0]; break;
        case 'yearly': key = date.getFullYear().toString(); break;
        default: key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      if (!grouped[key]) grouped[key] = { period: key, revenue: 0, count: 0 };
      grouped[key].revenue += parseFloat(p.total_amount) || 0;
      grouped[key].count += 1;
    });

    const chartData = Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
    return res.json({ success: true, period, data: chartData });
  } catch (error) {
    console.error('Revenue chart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch revenue chart data' });
  }
});

// GET /api/admin/dashboard/recent-activity
router.get('/recent-activity', adminAuth, requirePermission(PERMISSIONS.VIEW_DASHBOARD), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const activity = await getRecentActivity(limit);
    return res.json({ success: true, activity });
  } catch (error) {
    console.error('Recent activity error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch recent activity' });
  }
});

// GET /api/admin/dashboard/challan-stats
router.get('/challan-stats', adminAuth, requirePermission(PERMISSIONS.VIEW_DASHBOARD), async (req, res) => {
  try {
    const challans = await ChallanModel.find({}, 'status');
    const stats = { PENDING: 0, OVERDUE: 0, PAID: 0 };
    (challans || []).forEach(c => { stats[c.status] = (stats[c.status] || 0) + 1; });
    return res.json({ success: true, stats });
  } catch (error) {
    console.error('Challan stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch challan stats' });
  }
});

export default router;
