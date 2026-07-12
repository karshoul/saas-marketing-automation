import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true }, 
  subject: { type: String, required: true }, 
  htmlContent: { type: String, required: true }, 
  status: { 
    type: String, 
    enum: ['Draft', 'Queued', 'Sending', 'Completed'], 
    default: 'Draft' 
  },
  metrics: {
    totalSent: { type: Number, default: 0 },     
    deliveredCount: { type: Number, default: 0 }, 
    clickCount: { type: Number, default: 0 }     
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Campaign', campaignSchema);