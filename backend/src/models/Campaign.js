import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
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
    contentHtml: {
      type: String,
      required: true
    },
    targetTags: [
      {
        type: String,
        trim: true
      }
    ],
    status: {
      type: String,
      enum: ['DRAFT', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'DRAFT'
    },
    scheduledAt: {
      type: Date,
      default: null
    },
    sentAt: {
      type: Date,
      default: null
    },
    stats: {
      totalRecipients: { type: Number, default: 0 },
      sentCount: { type: Number, default: 0 },
      failedCount: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true
  }
);

campaignSchema.index({ tenantId: 1, status: 1 });

export default mongoose.model('Campaign', campaignSchema);