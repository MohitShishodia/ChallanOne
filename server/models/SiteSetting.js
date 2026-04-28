import mongoose from 'mongoose';

const siteSettingSchema = new mongoose.Schema({
  key:        { type: String, required: true, unique: true },
  value:      { type: String },
  category:   { type: String, default: 'general' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date }
});

export default mongoose.models.SiteSetting || mongoose.model('SiteSetting', siteSettingSchema);
