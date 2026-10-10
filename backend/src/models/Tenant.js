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
    // 🔥 BẮT BUỘC KHAI BÁO OWNERID ĐỂ MONGOOSE LƯU VÀ ĐỌC ĐƯỢC
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(TENANT_STATUS),
      default: TENANT_STATUS.TRIAL
    },
    plan: {
      type: String,
      enum: ['FREE', 'PRO', 'ENTERPRISE'],
      default: 'FREE'
    },
    planExpiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    quotas: {
      maxContacts: { type: Number, default: 500 },
      monthlyEmailLimit: { type: Number, default: 3000 },
      maxAutomations: { type: Number, default: 1 }
    },
    usage: {
      emailsSentThisMonth: { type: Number, default: 0 },
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
  { timestamps: true }
);

tenantSchema.index({ slug: 1 }, { unique: true });

export default mongoose.model('Tenant', tenantSchema);