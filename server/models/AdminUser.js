import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  name:          { type: String, required: true },
  role_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null },
  status:        { type: String, enum: ['active', 'inactive'], default: 'active' },
  last_login:    { type: Date, default: null },
  created_at:    { type: Date, default: Date.now }
});

export default mongoose.models.AdminUser || mongoose.model('AdminUser', adminSchema);
