import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    previewText: {
      type: String,
      trim: true,
      default: ''
    },
    htmlContent: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['MARKETING', 'NEWSLETTER', 'ONBOARDING', 'TRANSACTIONAL', 'OTHER'],
      default: 'MARKETING'
    },
    thumbnail: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

templateSchema.index({ tenantId: 1, name: 1 });
templateSchema.index({ tenantId: 1, category: 1 });

export default mongoose.model('Template', templateSchema);