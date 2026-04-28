import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  vehicle_number:    { type: String, required: true, unique: true, uppercase: true },
  vehicle_type:      { type: String, default: 'Car' },
  model:             { type: String },
  manufacturer:      { type: String },
  owner_name:        { type: String },
  registration_date: { type: String },
  insurance_expiry:  { type: String },
  insurance_status:  { type: String, default: 'active' },
  rc_status:         { type: String, default: 'ACTIVE' },
  fuel_type:         { type: String },
  color:             { type: String },
  chassis_number:    { type: String },
  engine_number:     { type: String },
  image_url:         { type: String },
  created_at:        { type: Date, default: Date.now }
});

export default mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);
