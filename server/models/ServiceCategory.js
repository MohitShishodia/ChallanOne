import mongoose from 'mongoose';

const serviceCategorySchema = new mongoose.Schema({
  name:       { type: String, required: true },
  slug:       { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.models.ServiceCategory || mongoose.model('ServiceCategory', serviceCategorySchema);
