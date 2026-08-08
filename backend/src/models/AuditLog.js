import mongoose from 'mongoose';
import { AUDIT_ACTIONS } from '../constants/audit/actions.js';
import { AUDIT_STATUS } from '../constants/audit/status.js';

const auditLogSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  email: {
    type: String,
    trim: true
  },
  action: {
    type: String,
    enum: Object.values(AUDIT_ACTIONS),
    required: true
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  userAgent: {
    type: String,
    default: 'Unknown'
  },
  status: {
    type: String,
    enum: Object.values(AUDIT_STATUS),
    required: true
  },
  metadata: {
    reason: { type: String, default: null },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    changes: { type: mongoose.Schema.Types.Mixed, default: null },
    extra: { type: mongoose.Schema.Types.Mixed, default: {} }
  }
}, { 
  // 🎯 TẮT hoàn toàn trường dữ liệu updatedAt vì bản ghi AuditLog mang tính chất bất biến (Immutable), không bao giờ có hành vi cập nhật sửa đổi.
  timestamps: { createdAt: true, updatedAt: false } 
});

// Chỉ mục phục vụ kết xuất nhật ký kiểm toán tải cao
auditLogSchema.index({ tenantId: 1, action: 1 });
auditLogSchema.index({ email: 1, action: 1 }); // Dùng để quét phát hiện các đợt tấn công dò mật khẩu (Brute-force)

export default mongoose.model('AuditLog', auditLogSchema);