import mongoose from 'mongoose';

const notificationLogSchema = new mongoose.Schema({
  type:       { type: String, enum: ['email', 'sms', 'push'], required: true },
  recipients: { type: String },
  subject:    { type: String },
  body:       { type: String },
  status:     { type: String, enum: ['pending', 'sent', 'failed'], default: 'sent' },
  admin_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
  sent_at:    { type: Date, default: Date.now }
});

export default mongoose.models.NotificationLog || mongoose.model('NotificationLog', notificationLogSchema);
