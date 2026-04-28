import mongoose from 'mongoose';

const cmsPageSchema = new mongoose.Schema({
  slug:             { type: String, required: true, unique: true },
  title:            { type: String, required: true },
  content:          { type: String, default: '' },
  meta_title:       { type: String },
  meta_description: { type: String },
  created_at:       { type: Date, default: Date.now },
  updated_at:       { type: Date }
});

export default mongoose.models.CmsPage || mongoose.model('CmsPage', cmsPageSchema);
