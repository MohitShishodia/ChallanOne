// Admin reports & analytics routes
import express from 'express';
import { adminAuth } from '../../middleware/adminAuth.js';
import { requirePermission, PERMISSIONS } from '../../middleware/rbac.js';
import PaymentModel from '../../models/Payment.js';
import ServiceModel from '../../models/Service.js';
import ServiceCategoryModel from '../../models/ServiceCategory.js';
import UserModel from '../../models/User.js';

const router = express.Router();

// GET /api/admin/reports/revenue
router.get('/revenue', adminAuth, requirePermission(PERMISSIONS.VIEW_REPORTS), async (req, res) => {
  try {
    const { period = 'monthly', dateFrom, dateTo } = req.query;
    const filter = { status: 'SUCCESS' };
    if (dateFrom || dateTo) {
      filter.paid_at = {};
      if (dateFrom) filter.paid_at.$gte = new Date(dateFrom);
      if (dateTo) filter.paid_at.$lte = new Date(dateTo);
    }

    const payments = await PaymentModel.find(filter, 'total_amount convenience_fee subtotal paid_at').sort({ paid_at: 1 });

    const grouped = {};
    (payments || []).forEach(p => {
      if (!p.paid_at) return;
      const date = new Date(p.paid_at);
      let key;
      switch (period) {
        case 'daily': key = date.toISOString().split('T')[0]; break;
        case 'weekly':
          const ws = new Date(date); ws.setDate(date.getDate() - date.getDay());
          key = ws.toISOString().split('T')[0]; break;
        case 'yearly': key = date.getFullYear().toString(); break;
        default: key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      if (!grouped[key]) grouped[key] = { period: key, revenue: 0, fees: 0, transactions: 0 };
      grouped[key].revenue += parseFloat(p.total_amount) || 0;
      grouped[key].fees += parseFloat(p.convenience_fee) || 0;
      grouped[key].transactions++;
    });

    const data = Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
    const totals = data.reduce((acc, d) => ({
      revenue: acc.revenue + d.revenue, fees: acc.fees + d.fees, transactions: acc.transactions + d.transactions
    }), { revenue: 0, fees: 0, transactions: 0 });

    return res.json({ success: true, period, data, totals });
  } catch (error) {
    console.error('Revenue report error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/reports/services
router.get('/services', adminAuth, requirePermission(PERMISSIONS.VIEW_REPORTS), async (req, res) => {
  try {
    const services = await ServiceModel.find().populate('category_id');
    const serviceStats = (services || []).map(s => ({
      id: s._id.toString(),
      name: s.name,
      category: s.category_id?.name || 'Uncategorized',
      price: parseFloat(s.price),
      status: s.status,
      isFeatured: s.is_featured
    }));

    return res.json({
      success: true,
      services: serviceStats,
      totalServices: serviceStats.length,
      activeServices: serviceStats.filter(s => s.status === 'active').length,
      featuredServices: serviceStats.filter(s => s.isFeatured).length
    });
  } catch (error) {
    console.error('Service report error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/reports/customers
router.get('/customers', adminAuth, requirePermission(PERMISSIONS.VIEW_REPORTS), async (req, res) => {
  try {
    const users = await UserModel.find({}, 'created_at').sort({ created_at: 1 });

    const grouped = {};
    (users || []).forEach(u => {
      if (!u.created_at) return;
      const date = new Date(u.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[key]) grouped[key] = { period: key, newUsers: 0, cumulative: 0 };
      grouped[key].newUsers++;
    });

    const data = Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
    let cumulative = 0;
    data.forEach(d => { cumulative += d.newUsers; d.cumulative = cumulative; });

    return res.json({ success: true, data, totalUsers: users?.length || 0 });
  } catch (error) {
    console.error('Customer report error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/reports/reconciliation
router.get('/reconciliation', adminAuth, requirePermission(PERMISSIONS.VIEW_REPORTS), async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const filter = {};
    if (dateFrom || dateTo) {
      filter.paid_at = {};
      if (dateFrom) filter.paid_at.$gte = new Date(dateFrom);
      if (dateTo) filter.paid_at.$lte = new Date(dateTo);
    }

    const payments = await PaymentModel.find(filter).sort({ paid_at: -1 });
    const summary = { totalTransactions: 0, successful: { count: 0, amount: 0 }, failed: { count: 0, amount: 0 }, refunded: { count: 0, amount: 0 }, pending: { count: 0, amount: 0 } };

    (payments || []).forEach(p => {
      summary.totalTransactions++;
      const amount = parseFloat(p.total_amount) || 0;
      switch (p.status) {
        case 'SUCCESS': summary.successful.count++; summary.successful.amount += amount; break;
        case 'FAILED': summary.failed.count++; summary.failed.amount += amount; break;
        case 'REFUNDED': summary.refunded.count++; summary.refunded.amount += amount; break;
        default: summary.pending.count++; summary.pending.amount += amount;
      }
    });

    return res.json({ success: true, summary, netRevenue: summary.successful.amount - summary.refunded.amount });
  } catch (error) {
    console.error('Reconciliation report error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
