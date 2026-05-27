import mongoose from 'mongoose';

const challanSearchSchema = new mongoose.Schema({
  vehicle_number: { type: String, required: true, index: true },
  search_type:    { type: String, enum: ['ALL_CHALLANS', 'DELHI_OTP', 'DB_LOOKUP'], required: true },
  user_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  ip_address:     { type: String },
  user_agent:     { type: String },
  status:         { type: String, enum: ['success', 'failed', 'no_results'], default: 'success' },
  challans_found: { type: Number, default: 0 },
  response_time_ms: { type: Number },
  error_message:  { type: String },
  metadata:       { type: mongoose.Schema.Types.Mixed },
  created_at:     { type: Date, default: Date.now, index: true }
});

challanSearchSchema.index({ created_at: -1 });
challanSearchSchema.index({ search_type: 1, created_at: -1 });

export default mongoose.models.ChallanSearch || mongoose.model('ChallanSearch', challanSearchSchema);
