import mongoose from 'mongoose';
import { TENANT_STATUS } from '../constants/tenant/status.js';

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
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
  deletedAt: {
    type: Date,
    default: null
  }
}, { 
  timestamps: true 
});

// Phục vụ cơ chế Routing và đối soát chủ tài khoản
tenantSchema.index({ slug: 1 }, { unique: true });
tenantSchema.index({ ownerId: 1 });

export default mongoose.model('Tenant', tenantSchema);