import mongoose from 'mongoose';

const emailJobSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      default: null,
      index: true
    },
    jobBullId: {
      type: String,
      required: true
    },
    recipientEmail: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['TRANSACTIONAL', 'OTP', 'MARKETING'],
      default: 'MARKETING'
    },
    priority: {
      type: Number,
      required: true // Giá trị P(t) tính từ AdaptiveScheduler
    },
    slaSeconds: {
      type: Number,
      default: 60 // SLA cam kết: OTP (5s), Marketing (60s)
    },
    waitingTimeMs: {
      type: Number,
      default: 0
    },
    isSlaViolated: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'QUEUED'
    },
    attempts: {
      type: Number,
      default: 0
    },
    errorMessage: {
      type: String,
      default: null
    },
    dispatchedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    },
    openedAt: {
    type: Date,
    default: null
    },
    openCount: {
    type: Number,
    default: 0
    },
    clickedAt: { type: Date, default: null },
    clickCount: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

// Chỉ mục hỗ trợ thống kê P95, Throughput và truy vấn báo cáo chiến dịch
emailJobSchema.index({ tenantId: 1, type: 1, isSlaViolated: 1 });
emailJobSchema.index({ campaignId: 1, status: 1 });

export default mongoose.model('EmailJob', emailJobSchema);