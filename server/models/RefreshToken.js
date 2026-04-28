import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  admin_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true },
  token:      { type: String, required: true },
  expires_at: { type: Date, required: true },
  is_revoked: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.models.RefreshToken || mongoose.model('RefreshToken', refreshTokenSchema);
