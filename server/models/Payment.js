import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  vehicle_number:      { type: String },
  challan_ids:         { type: [mongoose.Schema.Types.ObjectId], ref: 'Challan', default: [] },
  subtotal:            { type: Number, default: 0 },
  convenience_fee:     { type: Number, default: 0 },
  total_amount:        { type: Number, default: 0 },
  payment_method:      { type: String, default: 'Razorpay' },
  razorpay_order_id:   { type: String },
  razorpay_payment_id: { type: String },
  razorpay_signature:  { type: String },
  status:              { type: String, enum: ['SUCCESS', 'FAILED', 'REFUNDED', 'PENDING'], default: 'PENDING' },
  refund_reason:       { type: String },
  refunded_at:         { type: Date },
  paid_at:             { type: Date, default: Date.now },
  created_at:          { type: Date, default: Date.now }
});

export default mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
