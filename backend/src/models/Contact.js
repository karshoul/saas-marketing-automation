import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    firstName: {
      type: String,
      trim: true,
      default: ''
    },
    lastName: {
      type: String,
      trim: true,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    status: {
      type: String,
      enum: ['SUBSCRIBED', 'UNSUBSCRIBED', 'BOUNCED'],
      default: 'SUBSCRIBED'
    },
    customAttributes: {
      type: Map,
      of: String,
      default: {}
    },
    engagementScore: {
      type: Number,
      default: 0
    },
    lastActivityAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Ràng buộc Unique email trên từng Workspace riêng biệt (Multi-tenant)
contactSchema.index({ tenantId: 1, email: 1 }, { unique: true });

export default mongoose.model('Contact', contactSchema);