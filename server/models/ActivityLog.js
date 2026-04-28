import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  admin_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
  action:      { type: String, required: true },
  entity_type: { type: String },
  entity_id:   { type: String },
  details:     { type: mongoose.Schema.Types.Mixed },
  ip_address:  { type: String },
  created_at:  { type: Date, default: Date.now }
});

activityLogSchema.index({ admin_id: 1 });
activityLogSchema.index({ created_at: -1 });

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);
