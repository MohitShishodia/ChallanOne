// Admin payment management routes
import express from 'express';
import { adminAuth } from '../../middleware/adminAuth.js';
import { requirePermission, PERMISSIONS } from '../../middleware/rbac.js';
import { logActivity } from '../../data/activityLog.js';
import PaymentModel from '../../models/Payment.js';
import ReceiptModel from '../../models/Receipt.js';

const router = express.Router();

// GET /api/admin/payments/export/csv  (must be before /:id)
router.get('/export/csv', adminAuth, requirePermission(PERMISSIONS.EXPORT_REPORTS), async (req, res) => {
  try {
    const { dateFrom, dateTo, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.paid_at = {};
      if (dateFrom) filter.paid_at.$gte = new Date(dateFrom);
      if (dateTo) filter.paid_at.$lte = new Date(dateTo);
    }
    const payments = await PaymentModel.find(filter).sort({ paid_at: -1 });

    const headers = 'ID,Vehicle Number,Subtotal,Convenience Fee,Total Amount,Payment Method,Razorpay Payment ID,Status,Paid At\n';
    const rows = (payments || []).map(p =>
      `${p._id},${p.vehicle_number},${p.subtotal},${p.convenience_fee},${p.total_amount},${p.payment_method},${p.razorpay_payment_id},${p.status},${p.paid_at}`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=payments_${Date.now()}.csv`);
    return res.send(headers + rows);
  } catch (error) {
    console.error('Export CSV error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/payments/export/pdf
router.get('/export/pdf', adminAuth, requirePermission(PERMISSIONS.EXPORT_REPORTS), async (req, res) => {
  try {
    const PDFDocument = (await import('pdfkit')).default;
    const { dateFrom, dateTo, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.paid_at = {};
      if (dateFrom) filter.paid_at.$gte = new Date(dateFrom);
      if (dateTo) filter.paid_at.$lte = new Date(dateTo);
    }
    const payments = await PaymentModel.find(filter).sort({ paid_at: -1 }).limit(500);

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payments_${Date.now()}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('Payment Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Vehicle', 50, doc.y, { width: 80 });
    doc.text('Amount', 140, doc.y - 12, { width: 60 });
    doc.text('Status', 210, doc.y - 12, { width: 60 });
    doc.text('Payment ID', 280, doc.y - 12, { width: 130 });
    doc.text('Date', 420, doc.y - 12, { width: 120 });
    doc.moveDown();
    doc.font('Helvetica').fontSize(8);
    (payments || []).forEach(p => {
      if (doc.y > 700) { doc.addPage(); doc.y = 50; }
      const y = doc.y;
      doc.text(p.vehicle_number || 'N/A', 50, y, { width: 80 });
      doc.text(`₹${p.total_amount}`, 140, y, { width: 60 });
      doc.text(p.status, 210, y, { width: 60 });
      doc.text(p.razorpay_payment_id || 'N/A', 280, y, { width: 130 });
      doc.text(p.paid_at ? new Date(p.paid_at).toLocaleDateString() : 'N/A', 420, y, { width: 120 });
      doc.moveDown(0.5);
    });
    const total = (payments || []).reduce((s, p) => s + (parseFloat(p.total_amount) || 0), 0);
    doc.moveDown(2).fontSize(11).font('Helvetica-Bold').text(`Total: ₹${total.toFixed(2)} | Records: ${(payments || []).length}`);
    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/payments/reconciliation
router.get('/reconciliation', adminAuth, requirePermission(PERMISSIONS.VIEW_PAYMENTS), async (req, res) => {
  try {
    const payments = await PaymentModel.find({}, 'status total_amount paid_at');
    const reconciliation = { totalTransactions: 0, successfulPayments: 0, failedPayments: 0, refundedPayments: 0, totalCollected: 0, totalRefunded: 0, netRevenue: 0 };

    (payments || []).forEach(p => {
      reconciliation.totalTransactions++;
      const amount = parseFloat(p.total_amount) || 0;
      switch (p.status) {
        case 'SUCCESS': reconciliation.successfulPayments++; reconciliation.totalCollected += amount; break;
        case 'FAILED': reconciliation.failedPayments++; break;
        case 'REFUNDED': reconciliation.refundedPayments++; reconciliation.totalRefunded += amount; break;
      }
    });
    reconciliation.netRevenue = reconciliation.totalCollected - reconciliation.totalRefunded;
    return res.json({ success: true, reconciliation });
  } catch (error) {
    console.error('Reconciliation error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/payments
router.get('/', adminAuth, requirePermission(PERMISSIONS.VIEW_PAYMENTS), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, dateFrom, dateTo, minAmount, maxAmount, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const filter = {};
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.paid_at = {};
      if (dateFrom) filter.paid_at.$gte = new Date(dateFrom);
      if (dateTo) filter.paid_at.$lte = new Date(dateTo);
    }
    if (minAmount) filter.total_amount = { ...filter.total_amount, $gte: parseFloat(minAmount) };
    if (maxAmount) filter.total_amount = { ...filter.total_amount, $lte: parseFloat(maxAmount) };
    if (search) filter.$or = [
      { vehicle_number: { $regex: search, $options: 'i' } },
      { razorpay_payment_id: { $regex: search, $options: 'i' } },
      { razorpay_order_id: { $regex: search, $options: 'i' } }
    ];

    const [payments, total] = await Promise.all([
      PaymentModel.find(filter).sort({ paid_at: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      PaymentModel.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      payments: (payments || []).map(p => ({
        id: p._id.toString(), vehicleNumber: p.vehicle_number,
        subtotal: parseFloat(p.subtotal), convenienceFee: parseFloat(p.convenience_fee),
        totalAmount: parseFloat(p.total_amount), paymentMethod: p.payment_method,
        razorpayOrderId: p.razorpay_order_id, razorpayPaymentId: p.razorpay_payment_id,
        status: p.status, paidAt: p.paid_at
      })),
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/payments/:id
router.get('/:id', adminAuth, requirePermission(PERMISSIONS.VIEW_PAYMENTS), async (req, res) => {
  try {
    const payment = await PaymentModel.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    const receipt = await ReceiptModel.findOne({ payment_id: req.params.id });

    return res.json({
      success: true,
      payment: {
        id: payment._id.toString(), vehicleNumber: payment.vehicle_number,
        challanIds: payment.challan_ids, subtotal: parseFloat(payment.subtotal),
        convenienceFee: parseFloat(payment.convenience_fee), totalAmount: parseFloat(payment.total_amount),
        paymentMethod: payment.payment_method, razorpayOrderId: payment.razorpay_order_id,
        razorpayPaymentId: payment.razorpay_payment_id, razorpaySignature: payment.razorpay_signature,
        status: payment.status, paidAt: payment.paid_at
      },
      receipt: receipt || null
    });
  } catch (error) {
    console.error('Get payment detail error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/payments/:id/refund
router.post('/:id/refund', adminAuth, requirePermission(PERMISSIONS.PROCESS_REFUNDS), async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await PaymentModel.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.status === 'REFUNDED') return res.status(400).json({ success: false, message: 'Payment already refunded' });

    await PaymentModel.findByIdAndUpdate(req.params.id, {
      status: 'REFUNDED', refund_reason: reason, refunded_at: new Date()
    });

    await logActivity(req.admin.id, 'payment_refund', 'payment', req.params.id, {
      amount: payment.total_amount, reason
    });

    return res.json({ success: true, message: 'Refund processed successfully (recorded in system)' });
  } catch (error) {
    console.error('Refund error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
