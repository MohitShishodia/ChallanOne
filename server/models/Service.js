import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory', default: null },
  price:       { type: Number, default: 0 },
  status:      { type: String, enum: ['active', 'inactive'], default: 'active' },
  is_featured: { type: Boolean, default: false },
  icon:        { type: String },
  created_at:  { type: Date, default: Date.now },
  updated_at:  { type: Date }
});

export default mongoose.models.Service || mongoose.model('Service', serviceSchema);
