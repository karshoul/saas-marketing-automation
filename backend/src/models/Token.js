import mongoose from 'mongoose';
import { TOKEN_TYPES } from '../constants/auth/tokens.js';

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tokenHash: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: Object.values(TOKEN_TYPES),
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, { 
  timestamps: true 
});

// ⏳ TTL INDEX: Tự động thu hồi mã xác thực tạm thời
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
tokenSchema.index({ userId: 1, tokenHash: 1 });

export default mongoose.model('Token', tokenSchema);