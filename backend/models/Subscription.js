import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  packageType: { 
    type: String, 
    enum: ['Starter', 'Premium'], 
    default: 'Starter' 
  },
  status: { 
    type: String, 
    enum: ['Active', 'Pending', 'Expired'], 
    default: 'Pending' 
  },
  endDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Subscription', subscriptionSchema);