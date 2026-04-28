import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true },
  permissions: { type: [String], default: [] },
  is_system:   { type: Boolean, default: false },
  created_at:  { type: Date, default: Date.now }
});

export default mongoose.models.Role || mongoose.model('Role', roleSchema);
