import mongoose from 'mongoose';

const challanSchema = new mongoose.Schema({
  vehicle_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  challan_number:  { type: String, required: true, unique: true },
  violation_type:  { type: String },
  description:     { type: String },
  amount:          { type: Number, default: 0 },
  status:          { type: String, enum: ['PENDING', 'OVERDUE', 'PAID', 'RESOLVED', 'CANCELLED'], default: 'PENDING' },
  fine_date:       { type: String },
  fine_time:       { type: String },
  location:        { type: String },
  proof_image_url: { type: String },
  issued_by:       { type: String },
  created_at:      { type: Date, default: Date.now }
});

export default mongoose.models.Challan || mongoose.model('Challan', challanSchema);
