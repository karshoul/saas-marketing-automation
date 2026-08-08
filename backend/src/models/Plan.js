import mongoose from 'mongoose';
import { PLAN_CODES } from '../constants/billing/plans.js';

const planSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    enum: Object.values(PLAN_CODES),
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  monthlyPrice: {
    type: Number,
    required: true,
    min: 0
  },
  yearlyPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true
  },
  version: {
    type: Number,
    default: 1,
    required: true
  },
  limits: {
    maxContacts: { type: Number, required: true },
    maxEmailsPerMonth: { type: Number, required: true },
    maxCampaigns: { type: Number, required: true },
    maxWorkflows: { type: Number, required: true },
    maxTeamMembers: { type: Number, required: true }
  },
  features: {
    aiAssistant: { type: Boolean, default: false },
    automation: { type: Boolean, default: false },
    webhook: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    customSMTP: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Tối ưu hóa truy vấn đối soát cấu hình gói
planSchema.index({ code: 1 }, { unique: true });

export default mongoose.model('Plan', planSchema);