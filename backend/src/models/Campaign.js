import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
      default: null
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    fromName: {
      type: String,
      trim: true,
      default: ''
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
    targetSegment: {
      type: String,
      enum: ['ALL', 'VIP', 'ENTERPRISE', 'LEADS', 'CUSTOMERS'],
      default: 'ALL'
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
      default: 'DRAFT',
      index: true
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
      failedCount: { type: Number, default: 0 },
      openedCount: { type: Number, default: 0 }, // 👈 Đã bổ sung để lưu lượt mở
      clickedCount: { type: Number, default: 0 }  // 👈 Đã bổ sung để lưu lượt click
    }
  },
  {
    timestamps: true
  }
);

campaignSchema.index({ tenantId: 1, status: 1 });

export default mongoose.model('Campaign', campaignSchema);