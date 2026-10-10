import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['OWNER', 'ADMIN', 'MEMBER'],
      default: 'MEMBER'
    },
    status: {
      type: String,
      enum: ['PENDING','INVITED', 'ACTIVE', 'SUSPENDED'],
      default: 'ACTIVE'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Ràng buộc: Một người dùng chỉ có 1 vai trò duy nhất trong 1 Workspace cụ thể
membershipSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

export default mongoose.model('Membership', membershipSchema);