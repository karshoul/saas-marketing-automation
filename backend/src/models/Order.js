import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
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
      required: true
    },
    orderCode: {
      type: String,
      required: true,
      unique: true // Ví dụ: VDO-99214
    },
    plan: {
      type: String,
      enum: ['PRO', 'ENTERPRISE'],
      required: true
    },
    amount: {
      type: Number,
      required: true // Số tiền VND (VD: 590000 cho Pro)
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'CANCELLED'],
      default: 'PENDING'
    },
    paymentMethod: {
      type: String,
      default: 'VIETQR' // VIETQR / PAYOS / STRIPE
    },
    paidAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Order', orderSchema);