// Admin site settings routes
import express from 'express';
import { adminAuth } from '../../middleware/adminAuth.js';
import { requirePermission, PERMISSIONS } from '../../middleware/rbac.js';
import { logActivity } from '../../data/activityLog.js';
import SiteSettingModel from '../../models/SiteSetting.js';

const router = express.Router();

// GET /api/admin/settings
router.get('/', adminAuth, requirePermission(PERMISSIONS.VIEW_SETTINGS), async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category) filter.category = category;

    const settings = await SiteSettingModel.find(filter).sort({ key: 1 });

    const grouped = {};
    (settings || []).forEach(s => {
      if (!grouped[s.category]) grouped[s.category] = {};
      grouped[s.category][s.key] = s.value;
    });

    return res.json({ success: true, settings: grouped, raw: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/settings
router.put('/', adminAuth, requirePermission(PERMISSIONS.MANAGE_SETTINGS), async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({ success: false, message: 'Settings array is required' });
    }

    const errors = [];
    const updated = [];

    for (const setting of settings) {
      try {
        await SiteSettingModel.findOneAndUpdate(
          { key: setting.key },
          { key: setting.key, value: setting.value, category: setting.category || 'general', updated_at: new Date() },
          { upsert: true, new: true }
        );
        updated.push(setting.key);
      } catch (e) {
        errors.push({ key: setting.key, error: e.message });
      }
    }

    await logActivity(req.admin.id, 'settings_updated', 'settings', null, { updated, errors });

    return res.json({
      success: errors.length === 0,
      message: errors.length === 0 ? 'All settings updated successfully' : 'Some settings failed to update',
      updated, errors
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/settings/notifications
router.put('/notifications', adminAuth, requirePermission(PERMISSIONS.MANAGE_SETTINGS), async (req, res) => {
  try {
    const { email_enabled, sms_enabled, push_enabled } = req.body;

    const updates = [];
    if (email_enabled !== undefined) updates.push({ key: 'email_notifications_enabled', value: String(email_enabled), category: 'notifications' });
    if (sms_enabled !== undefined) updates.push({ key: 'sms_notifications_enabled', value: String(sms_enabled), category: 'notifications' });
    if (push_enabled !== undefined) updates.push({ key: 'push_notifications_enabled', value: String(push_enabled), category: 'notifications' });

    for (const u of updates) {
      await SiteSettingModel.findOneAndUpdate(
        { key: u.key },
        { ...u, updated_at: new Date() },
        { upsert: true }
      );
    }

    await logActivity(req.admin.id, 'notification_settings_updated', 'settings', null, req.body);

    return res.json({ success: true, message: 'Notification settings updated' });
  } catch (error) {
    console.error('Notification settings error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
