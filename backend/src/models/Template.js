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
    category: {
      type: String,
      enum: ['TRANSACTIONAL', 'MARKETING', 'ONBOARDING', 'SYSTEM'],
      default: 'MARKETING'
    },
    contentHtml: {
      type: String,
      required: true
    },
    variables: [
      {
        type: String,
        trim: true
      }
    ]
  },
  {
    timestamps: true
  }
);

templateSchema.index({ tenantId: 1, name: 1 });

export default mongoose.model('Template', templateSchema);