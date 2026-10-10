import mongoose from 'mongoose';
import { ROLES } from '../constants/auth/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: false
    },
    googleId: {
      type: String,
      default: null
    },
    avatar: {
      type: String,
      default: null
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    // 🔥 KHAI BÁO ĐẦY ĐỦ CÁC TRƯỜNG ĐỂ TRÁNH BỊ STRIP
    isSuperAdmin: {
      type: Boolean,
      default: false
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      default: null
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.MEMBER
    }
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, role: 1 });
userSchema.index({ googleId: 1 });

export default mongoose.model('User', userSchema);