import mongoose from 'mongoose';
import { SUBSCRIPTION_STATUS, PAYMENT_PROVIDERS, BILLING_CYCLES } from '../constants/billing/subscription.js';

const subscriptionSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    unique: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  status: {
    type: String,
    enum: Object.values(SUBSCRIPTION_STATUS),
    default: SUBSCRIPTION_STATUS.TRIAL
  },
  billingCycle: {
    type: String,
    enum: Object.values(BILLING_CYCLES),
    required: true
  },
  trialEnd: {
    type: Date,
    default: null
  },
  nextBillingDate: {
    type: Date,
    required: true
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  paymentProvider: {
    type: String,
    enum: Object.values(PAYMENT_PROVIDERS),
    default: PAYMENT_PROVIDERS.NONE
  },
  externalCustomerId: {
    type: String,
    default: null
  },
  planSnapshot: {
    code: { type: String, required: true },
    version: { type: Number, required: true },
    limits: {
      maxContacts: { type: Number, required: true },
      maxEmailsPerMonth: { type: Number, required: true },
      maxCampaigns: { type: Number, required: true },
      maxWorkflows: { type: Number, required: true },
      maxTeamMembers: { type: Number, required: true }
    },
    features: {
      aiAssistant: { type: Boolean, required: true },
      automation: { type: Boolean, required: true },
      webhook: { type: Boolean, required: true },
      apiAccess: { type: Boolean, required: true },
      customSMTP: { type: Boolean, required: true },
      analytics: { type: Boolean, required: true }
    }
  },
  usage: {
    emailsSentThisMonth: { type: Number, default: 0, min: 0 },
    contactsCount: { type: Number, default: 0, min: 0 },
    automationsCount: { type: Number, default: 0, min: 0 },
    aiCreditsUsed: { type: Number, default: 0, min: 0 }
  }
}, { 
  timestamps: true 
});

// Chỉ mục tăng tốc kiểm định giới hạn tài nguyên real-time
subscriptionSchema.index({ tenantId: 1 }, { unique: true });
subscriptionSchema.index({ externalCustomerId: 1 }, { sparse: true });

export default mongoose.model('Subscription', subscriptionSchema);