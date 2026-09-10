import mongoose from 'mongoose';
import { TENANT_STATUS } from '../constants/tenant/status.js';

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(TENANT_STATUS),
      default: TENANT_STATUS.TRIAL
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // ==========================================
    // 💳 THÔNG TIN GÓI CƯỚC & PHÂN TẦNG TIER (W_tier)
    // ==========================================
    plan: {
      type: String,
      enum: ['FREE', 'PRO', 'ENTERPRISE'],
      default: 'FREE'
    },
    planExpiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 ngày dùng thử
    },
    quotas: {
      maxContacts: {
        type: Number,
        default: 500 // Free: 500, Pro: 10.000, Enterprise: 100.000
      },
      monthlyEmailLimit: {
        type: Number,
        default: 3000 // Free: 3.000, Pro: 50.000, Enterprise: 500.000
      },
      maxAutomations: {
        type: Number,
        default: 1 // Free: 1, Pro: 10, Enterprise: 100
      }
    },
    usage: {
      emailsSentThisMonth: {
        type: Number,
        default: 0
      },
      cycleResetAt: {
        type: Date,
        default: () => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
      }
    },

    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

tenantSchema.index({ slug: 1 }, { unique: true });
tenantSchema.index({ ownerId: 1 });

export default mongoose.model('Tenant', tenantSchema);