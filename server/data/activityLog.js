// Activity logging system - MongoDB
import ActivityLogModel from '../models/ActivityLog.js';

export async function logActivity(adminId, action, entityType = null, entityId = null, details = null, ipAddress = null) {
  try {
    await ActivityLogModel.create({
      admin_id: adminId || null,
      action,
      entity_type: entityType,
      entity_id: entityId ? String(entityId) : null,
      details: details || null,
      ip_address: ipAddress
    });
    return true;
  } catch (error) {
    console.error('Log activity error:', error);
    return false;
  }
}

export async function getRecentActivity(limit = 50) {
  try {
    const logs = await ActivityLogModel.find()
      .populate('admin_id', 'id name email')
      .sort({ created_at: -1 })
      .limit(limit);

    return logs.map(a => ({
      id: a._id.toString(),
      action: a.action,
      entityType: a.entity_type,
      entityId: a.entity_id,
      details: a.details,
      ipAddress: a.ip_address,
      admin: a.admin_id ? {
        id: a.admin_id._id?.toString(),
        name: a.admin_id.name,
        email: a.admin_id.email
      } : null,
      createdAt: a.created_at
    }));
  } catch (error) {
    console.error('Get activity error:', error);
    return [];
  }
}

export async function getActivityByAdmin(adminId, limit = 50) {
  try {
    return await ActivityLogModel.find({ admin_id: adminId })
      .sort({ created_at: -1 })
      .limit(limit);
  } catch (error) {
    return [];
  }
}

export async function getActivityByEntity(entityType, entityId, limit = 50) {
  try {
    const logs = await ActivityLogModel.find({ entity_type: entityType, entity_id: String(entityId) })
      .populate('admin_id', 'id name email')
      .sort({ created_at: -1 })
      .limit(limit);
    return logs;
  } catch (error) {
    return [];
  }
}

export async function cleanupOldActivity() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    await ActivityLogModel.deleteMany({ created_at: { $lt: cutoff } });
    return true;
  } catch (error) {
    console.error('Cleanup activity error:', error);
    return false;
  }
}
