import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  tags: [{ type: String }], // Ví dụ: ['Khách_Vip', 'Đồ_Nam']
  createdAt: { type: Date, default: Date.now }
});

// Đảm bảo trong cùng 1 Shop thì không bị trùng Email khách hàng
contactSchema.index({ tenantId: 1, email: 1 }, { unique: true });

export default mongoose.model('Contact', contactSchema);