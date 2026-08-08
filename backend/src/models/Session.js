import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  tokenHash: {
    type: String,
    required: true
  },
  deviceInfo: {
    type: String,
    default: 'Unknown'
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  fingerprint: {
    type: String,
    required: true
  },
  isRevoked: {
    type: Boolean,
    default: false,
    required: true
  },
  revokedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, { 
  timestamps: true 
});

// ⏳ TTL INDEX: Tự động hủy document vật lý khi chạm mốc thời gian hết hạn
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Chỉ mục hỗn hợp phục vụ xác thực bảo mật đa phiên
sessionSchema.index({ userId: 1, tokenHash: 1 });
sessionSchema.index({ tenantId: 1 });

export default mongoose.model('Session', sessionSchema);