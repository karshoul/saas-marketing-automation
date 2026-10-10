import mongoose from 'mongoose';

const stepSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['SEND_EMAIL', 'DELAY', 'ADD_TAG', 'UPDATE_SEGMENT'],
      required: true
    },
    config: {
      templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template',
        default: null
      },
      delayValue: {
        type: Number,
        default: 1
      },
      delayUnit: {
        type: String,
        enum: ['MINUTES', 'HOURS', 'DAYS'],
        default: 'HOURS'
      },
      tag: {
        type: String,
        trim: true,
        default: ''
      },
      segment: {
        type: String,
        enum: ['LEADS', 'VIP', 'ENTERPRISE', 'CUSTOMERS'],
        default: 'LEADS'
      }
    }
  },
  { _id: false }
);

const automationSchema = new mongoose.Schema(
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
    description: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'PAUSED'],
      default: 'DRAFT',
      index: true
    },
    trigger: {
      type: {
        type: String,
        enum: ['CONTACT_CREATED', 'SEGMENT_JOINED', 'TAG_ADDED'],
        default: 'CONTACT_CREATED'
      },
      config: {
        segment: { type: String, default: 'ALL' },
        tag: { type: String, default: '' }
      }
    },
    steps: [stepSchema],
    stats: {
      totalEntered: { type: Number, default: 0 },
      totalCompleted: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

automationSchema.index({ tenantId: 1, status: 1 });

export default mongoose.model('Automation', automationSchema);