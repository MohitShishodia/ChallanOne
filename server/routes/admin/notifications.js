// Admin notification management routes
import express from 'express';
import { adminAuth } from '../../middleware/adminAuth.js';
import { requirePermission, PERMISSIONS } from '../../middleware/rbac.js';
import { logActivity } from '../../data/activityLog.js';
import NotificationLogModel from '../../models/NotificationLog.js';

const router = express.Router();

// POST /api/admin/notifications/email
router.post('/email', adminAuth, requirePermission(PERMISSIONS.SEND_NOTIFICATIONS), async (req, res) => {
  try {
    const { subject, body, recipients } = req.body;
    if (!subject || !body) return res.status(400).json({ success: false, message: 'Subject and body are required' });

    const notification = await NotificationLogModel.create({
      type: 'email', recipients: recipients || 'all_users', subject, body,
      status: 'sent', admin_id: req.admin.id
    });

    await logActivity(req.admin.id, 'email_notification_sent', 'notification', notification._id.toString(), { subject, recipients });

    return res.json({ success: true, message: 'Email notification sent successfully', notification });
  } catch (error) {
    console.error('Send email error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/notifications/sms
router.post('/sms', adminAuth, requirePermission(PERMISSIONS.SEND_NOTIFICATIONS), async (req, res) => {
  try {
    const { message, recipients } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    const notification = await NotificationLogModel.create({
      type: 'sms', recipients: recipients || 'all_users', subject: 'SMS', body: message,
      status: 'sent', admin_id: req.admin.id
    });

    await logActivity(req.admin.id, 'sms_notification_sent', 'notification', notification._id.toString(), { recipients });

    return res.json({ success: true, message: 'SMS notification sent successfully', notification });
  } catch (error) {
    console.error('Send SMS error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/notifications/push
router.post('/push', adminAuth, requirePermission(PERMISSIONS.SEND_NOTIFICATIONS), async (req, res) => {
  try {
    const { title, message, recipients } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, message: 'Title and message are required' });

    const notification = await NotificationLogModel.create({
      type: 'push', recipients: recipients || 'all_users', subject: title, body: message,
      status: 'sent', admin_id: req.admin.id
    });

    return res.json({ success: true, message: 'Push notification sent successfully', notification });
  } catch (error) {
    console.error('Push notification error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/notifications/history
router.get('/history', adminAuth, requirePermission(PERMISSIONS.VIEW_NOTIFICATIONS), async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const filter = {};
    if (type) filter.type = type;

    const [data, total] = await Promise.all([
      NotificationLogModel.find(filter).populate('admin_id', 'id name email')
        .sort({ sent_at: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      NotificationLogModel.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      notifications: data || [],
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Notification history error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
