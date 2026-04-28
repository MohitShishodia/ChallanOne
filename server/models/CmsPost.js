import mongoose from 'mongoose';

const cmsPostSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  slug:         { type: String, required: true, unique: true },
  content:      { type: String, default: '' },
  excerpt:      { type: String },
  status:       { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  author_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
  published_at: { type: Date },
  created_at:   { type: Date, default: Date.now },
  updated_at:   { type: Date }
});

export default mongoose.models.CmsPost || mongoose.model('CmsPost', cmsPostSchema);
