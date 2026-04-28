import mongoose from 'mongoose';

const ticketResponseSchema = new mongoose.Schema({
  message:    { type: String, required: true },
  admin_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
  created_at: { type: Date, default: Date.now }
});

const supportTicketSchema = new mongoose.Schema({
  user_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  subject:     { type: String, required: true },
  description: { type: String, required: true },
  priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status:      { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
  responses:   { type: [ticketResponseSchema], default: [] },
  created_at:  { type: Date, default: Date.now },
  updated_at:  { type: Date },
  resolved_at: { type: Date }
});

export default mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);
