import mongoose from 'mongoose';

const cmsFaqSchema = new mongoose.Schema({
  question:   { type: String, required: true },
  answer:     { type: String, required: true },
  category:   { type: String, default: 'general' },
  sort_order: { type: Number, default: 0 },
  is_active:  { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date }
});

export default mongoose.models.CmsFaq || mongoose.model('CmsFaq', cmsFaqSchema);
