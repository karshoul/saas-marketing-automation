import mongoose from 'mongoose';

const executionLogSchema = new mongoose.Schema(
  {
    stepId: { type: String, required: true },
    stepType: { type: String, required: true },
    executedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['SUCCESS', 'FAILED', 'SKIPPED'], default: 'SUCCESS' },
    message: { type: String, default: '' }
  },
  { _id: false }
);

const automationExecutionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    automationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Automation',
      required: true,
      index: true
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
      index: true
    },
    currentStepIndex: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'],
      default: 'IN_PROGRESS',
      index: true
    },
    nextExecutionAt: {
      type: Date,
      default: null
    },
    logs: [executionLogSchema]
  },
  { timestamps: true }
);

// Tránh trường hợp 1 khách hàng bị kích hoạt lặp vô tận cùng 1 kịch bản khi đang chạy dở
automationExecutionSchema.index(
  { automationId: 1, contactId: 1, status: 1 }
);

export default mongoose.model('AutomationExecution', automationExecutionSchema);