import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema({
  payment_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
  receipt_number:  { type: String, required: true, unique: true },
  vehicle_number:  { type: String },
  challan_details: { type: mongoose.Schema.Types.Mixed },
  amount_paid:     { type: Number, default: 0 },
  payment_date:    { type: Date, default: Date.now },
  email_sent:      { type: Boolean, default: false },
  sms_sent:        { type: Boolean, default: false },
  created_at:      { type: Date, default: Date.now }
});

export default mongoose.models.Receipt || mongoose.model('Receipt', receiptSchema);
