import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  name:          { type: String, default: null },
  phone:         { type: String, default: null },
  status:        { type: String, enum: ['active', 'inactive'], default: 'active' },
  last_login:    { type: Date, default: Date.now },
  created_at:    { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model('User', userSchema);
