import mongoose from 'mongoose';
import crypto from 'crypto';

// Repositories
import userRepository from '../repositories/user.repository.js';
import tenantRepository from '../repositories/tenant.repository.js';
import subscriptionRepository from '../repositories/subscription.repository.js';
import planRepository from '../repositories/plan.repository.js';
import tokenRepository from '../repositories/token.repository.js';
import sessionRepository from '../repositories/session.repository.js';
import auditLogRepository from '../repositories/auditLog.repository.js';

// Services & Utilities
import emailService from './email.service.js';
import { comparePassword, hashPassword, hashVerificationToken, hashRefreshToken } from '../utils/hash.util.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.util.js';
import ApiError from '../utils/apiError.util.js';

// Constants
import { ROLES } from '../constants/auth/roles.js';
import { TOKEN_TYPES } from '../constants/auth/tokens.js';
import { PLAN_CODES } from '../constants/billing/plans.js';
import { SUBSCRIPTION_STATUS, PAYMENT_PROVIDERS, BILLING_CYCLES } from '../constants/billing/subscription.js';
import { AUDIT_ACTIONS } from '../constants/audit/actions.js';
import { AUDIT_STATUS } from '../constants/audit/status.js';
import { TENANT_STATUS } from '../constants/tenant/status.js';

// Auth
import {TOKEN_EXPIRY} from '../constants/auth/tokens.js';

class AuthService {
  
  /**
   * 🔄 FLOW 1: REGISTER (Bọc toàn cục trong ACID Database Transaction)
   */
  async register(registerDto, context) {
    // 1. Chuẩn hóa & bóc tách dữ liệu đầu vào an toàn
    const name = registerDto.name || registerDto.fullName;
    const companyName = registerDto.companyName || registerDto.workspaceName;
    const { email, password } = registerDto;

    if (!name) {
      throw new ApiError(400, 'Tên người dùng không được để trống.');
    }

    if (!companyName) {
      throw new ApiError(400, 'Tên doanh nghiệp/Workspace không được để trống.');
    }

    if (!email) {
      throw new ApiError(400, 'Địa chỉ email không được để trống.');
    }

    const cleanEmail = email.toLowerCase().trim();

    // 2. Check Email tồn tại trên toàn hệ thống
    const existingUser = await userRepository.findByEmail(cleanEmail);
    if (existingUser) {
      await auditLogRepository.createLog({
        email: cleanEmail,
        action: AUDIT_ACTIONS.REGISTER,
        ipAddress: context.ip,
        userAgent: context.ua,
        status: AUDIT_STATUS.FAILED,
        metadata: { reason: 'Email đã tồn tại trên hệ thống.' }
      });
      throw new ApiError(400, 'Địa chỉ email này đã được đăng ký sử dụng.');
    }

    // 3. Kiểm tra trùng lặp Slug Workspace
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const existingTenant = await tenantRepository.findOne({ slug });
    if (existingTenant) {
      throw new ApiError(400, 'Tên doanh nghiệp trùng lặp slug URL. Vui lòng chọn tên khác.');
    }

    // 4. Lấy cấu hình FREE PLAN từ Database
    const freePlan = await planRepository.findByCode(PLAN_CODES.FREE);
    if (!freePlan) {
      throw new ApiError(500, 'Lỗi cấu hình Core: Hệ thống chưa thực hiện Seeding gói FREE.');
    }

    // 5. Cấu hình Session Transaction linh hoạt theo môi trường MongoDB
    const session = await mongoose.startSession();
    
    // Kiểm tra xem Topology Client có hỗ trợ ReplicaSet / Sharded Cluster không
    const topologyType = session.client?.topology?.description?.type || '';
    const isReplicaSet = topologyType.includes('ReplicaSet') || topologyType.includes('Sharded');

    if (isReplicaSet) {
      session.startTransaction();
    }

    // Tự động ghim { session } nếu môi trường có hỗ trợ ReplicaSet
    const sessionOption = isReplicaSet ? { session } : {};

    try {
      // --- STEP A: Tạo Tenant ---
      const tenants = await tenantRepository.create([{
        name: companyName,
        slug,
        status: TENANT_STATUS.TRIAL
      }], sessionOption);
      const tenant = tenants[0];
      const tenantId = tenant._id;

      // --- STEP B: Tạo Subscription mặc định (Trial) & Snapshot Plan FREE ---
      const trialDuration = 14 * 24 * 60 * 60 * 1000; // 14 ngày dùng thử
      await subscriptionRepository.create([{
        tenantId,
        planId: freePlan._id,
        status: SUBSCRIPTION_STATUS.TRIAL,
        billingCycle: BILLING_CYCLES.MONTHLY,
        trialEnd: new Date(Date.now() + trialDuration),
        nextBillingDate: new Date(Date.now() + trialDuration),
        paymentProvider: PAYMENT_PROVIDERS.NONE,
        planSnapshot: {
          code: freePlan.code,
          version: freePlan.version,
          limits: freePlan.limits,
          features: freePlan.features
        }
      }], sessionOption);

      // --- STEP C: Tạo User OWNER (Băm password bằng Bcrypt) ---
      const hashedPassword = await hashPassword(password);
      const users = await userRepository.create([{
        tenantId,
        name,
        email: cleanEmail,
        password: hashedPassword,
        role: ROLES.OWNER,
        isVerified: false
      }], sessionOption);
      const user = users[0];
      const userId = user._id;

      // Cập nhật ownerId cho Tenant
      await tenantRepository.update(tenantId, { ownerId: userId }, sessionOption);

      // --- STEP D: Tạo Verify Token (Băm SHA-256) ---
      const plainVerifyToken = crypto.randomBytes(32).toString('hex');
      const verifyTokenHash = hashVerificationToken(plainVerifyToken);
      await tokenRepository.create([{
        userId,
        tokenHash: verifyTokenHash,
        type: TOKEN_TYPES.VERIFY_EMAIL,
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY.VERIFICATION)
      }], sessionOption);

      // --- STEP E: Tạo Session (Mã hóa Refresh Token bằng SHA-256) ---
      const tokenPayload = { id: userId, tenantId, role: user.role };
      const accessToken = signAccessToken(tokenPayload);
      const plainRefreshToken = signRefreshToken({ id: userId });
      const refreshTokenHash = hashRefreshToken(plainRefreshToken);

      await sessionRepository.create([{
        userId,
        tenantId,
        tokenHash: refreshTokenHash,
        deviceInfo: context.ua || 'Unknown Device',
        ipAddress: context.ip || '127.0.0.1',
        fingerprint: context.fingerprint || 'default_fingerprint',
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY.REFRESH)
      }], sessionOption);

      // --- STEP F: Ghi AuditLog ---
      await auditLogRepository.createLog({
        tenantId,
        userId,
        email: cleanEmail,
        action: AUDIT_ACTIONS.REGISTER,
        ipAddress: context.ip,
        userAgent: context.ua,
        status: AUDIT_STATUS.SUCCESS,
        metadata: { companyName, slug }
      }, sessionOption);

      // --- STEP G: Commit Transaction (Nếu có sử dụng) ---
      if (isReplicaSet) {
        await session.commitTransaction();
      }
      session.endSession();

      // --- STEP H: Gửi Mail Kích hoạt (Non-blocking Background Task) ---
      emailService.sendVerificationEmail({
        email: cleanEmail,
        name,
        token: plainVerifyToken
      }).catch(err => console.error('❌ Lỗi gửi email kích hoạt ngầm:', err.message));

      // --- STEP I: Trả về kết quả ---
      return {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        },
        tenant: {
          id: tenant._id,
          name: tenant.name,
          slug: tenant.slug
        },
        accessToken,
        refreshToken: plainRefreshToken
      };

    } catch (error) {
      // Rollback nếu có lỗi phát sinh trong Transaction
      if (isReplicaSet) {
        await session.abortTransaction();
      }
      session.endSession();
      throw error;
    }
  }

  /**
   * 🔄 FLOW 2: LOGIN (Xử lý đa phiên)
   */
  async login(loginDto, context) {
    const { email, password, deviceInfo, fingerprint } = loginDto;
    const cleanEmail = email.toLowerCase().trim();

    // 1. Kiểm tra sự tồn tại của tài khoản User trong Database
    const user = await userRepository.findByEmail(cleanEmail);
    if (!user) {
      await auditLogRepository.createLog({
        email: cleanEmail,
        action: AUDIT_ACTIONS.LOGIN,
        ipAddress: context.ip,
        userAgent: context.ua,
        status: AUDIT_STATUS.FAILED,
        metadata: { reason: 'USER_NOT_FOUND' }
      });
      throw new ApiError(401, 'Email hoặc mật khẩu không chính xác.');
    }

    // 2. So sánh mật khẩu thô với mật khẩu đã băm (bcrypt) trong Database
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      await auditLogRepository.createLog({
        tenantId: user.tenantId,
        userId: user._id,
        email: cleanEmail,
        action: AUDIT_ACTIONS.LOGIN,
        ipAddress: context.ip,
        userAgent: context.ua,
        status: AUDIT_STATUS.FAILED,
        metadata: { reason: 'INVALID_PASSWORD' }
      });
      throw new ApiError(401, 'Email hoặc mật khẩu không chính xác.');
    }

    // 3. Kiểm tra trạng thái kích hoạt hòm thư (isVerified)
    if (!user.isVerified) {
      await auditLogRepository.createLog({
        tenantId: user.tenantId,
        userId: user._id,
        email: cleanEmail,
        action: AUDIT_ACTIONS.LOGIN,
        ipAddress: context.ip,
        userAgent: context.ua,
        status: AUDIT_STATUS.FAILED,
        metadata: { reason: 'EMAIL_NOT_VERIFIED' }
      });
      throw new ApiError(403, 'Tài khoản chưa được kích hoạt email. Vui lòng kiểm tra hộp thư để xác thực trước khi đăng nhập.');
    }

    // 4. Sinh cặp JWT Access Token & Refresh Token
    // Payload khi ký JWT (sign JWT)
const tokenPayload = {
  id: user._id,
  tenantId: user.tenantId,
  role: user.role,
  email: user.email
};

    const accessToken = signAccessToken(tokenPayload);
    const plainRefreshToken = signRefreshToken({ id: user._id });

    // 5. Băm Refresh Token thô bằng SHA-256
    const refreshTokenHash = hashRefreshToken(plainRefreshToken);

    // 6. Lưu trữ thông tin Session đa thiết bị vào Database
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.REFRESH);
    await sessionRepository.create({
      userId: user._id,
      tenantId: user.tenantId,
      tokenHash: refreshTokenHash,
      deviceInfo: deviceInfo || context.ua || 'Unknown Device',
      ipAddress: context.ip || '127.0.0.1',
      fingerprint: fingerprint || 'default_fingerprint',
      expiresAt
    });

    // 7. Ghi Audit Log hành động Đăng nhập thành công
    await auditLogRepository.createLog({
      tenantId: user.tenantId,
      userId: user._id,
      email: cleanEmail,
      action: AUDIT_ACTIONS.LOGIN,
      ipAddress: context.ip,
      userAgent: context.ua,
      status: AUDIT_STATUS.SUCCESS,
      metadata: { deviceInfo: deviceInfo || context.ua }
    });

    // 8. Trả về thông tin User và cặp Tokens
    return {
      user: {
        id: user._id,
        tenantId: user.tenantId,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      },
      accessToken,
      refreshToken: plainRefreshToken
    };
  }

  async logoutAllDevices(userId, tenantId, context) {
    // 1. Thu hồi toàn bộ Session đang active của User trong Database
    const result = await sessionRepository.revokeAllUserSessions(userId);

    // 2. Ghi nhật ký kiểm toán (Audit Log) cho hành động an ninh này
    await auditLogRepository.createLog({
      tenantId,
      userId,
      action: AUDIT_ACTIONS.SESSION_REVOKED,
      ipAddress: context.ip,
      userAgent: context.ua,
      status: AUDIT_STATUS.SUCCESS,
      metadata: {
        reason: 'USER_REQUESTED_LOGOUT_ALL',
        revokedSessionsCount: result.modifiedCount || 0,
        executedAt: new Date()
      }
    });

    return {
      revokedSessionsCount: result.modifiedCount || 0
    };
  }

  /**
   * 🔄 FLOW 3: REFRESH TOKEN (Cấp lại Access Token mới qua vòng quay phiên)
   */
  async refreshAccessToken(plainRefreshToken, context) {
    // 1. Trích xuất Token từ Cookie (Nếu không có -> Từ chối ngay)
    if (!plainRefreshToken) {
      throw new ApiError(401, 'Yêu cầu không hợp lệ. Vắng mặt Refresh Token trong phiên.');
    }

    // Verify JWT Signature sơ bộ của Refresh Token
    try {
      verifyRefreshToken(plainRefreshToken);
    } catch (error) {
      throw new ApiError(401, 'Refresh Token không hợp lệ hoặc đã bị can thiệp.');
    }

    // 2. Băm SHA-256 chuỗi Token thô để tra cứu trong Database
    const tokenHash = hashRefreshToken(plainRefreshToken);

    // 3. Tìm Session tương ứng trong Database
    const session = await sessionRepository.findByTokenHash(tokenHash);

    if (!session) {
      throw new ApiError(401, 'Phiên làm việc không tồn tại hoặc đã bị đăng xuất.');
    }

    // 4. KIỂM TRA REVOKED (Cơ chế chống Replay Attack):
    // Nếu token gửi lên thuộc về một Session ĐÃ BỊ REVOKE trước đó, điều này cảnh báo token cũ đã bị kẻ gian đánh cắp và tái sử dụng!
    if (session.isRevoked) {
      // Báo động an ninh: Thu hồi TẤT CẢ các phiên còn lại của User này ngay lập tức!
      await sessionRepository.revokeAllUserSessions(session.userId);

      await auditLogRepository.createLog({
        tenantId: session.tenantId,
        userId: session.userId,
        action: AUDIT_ACTIONS.SESSION_REVOKED,
        ipAddress: context.ip,
        userAgent: context.ua,
        status: AUDIT_STATUS.FAILED,
        metadata: { reason: 'REPLAY_ATTACK_DETECTED', sessionHash: tokenHash }
      });

      throw new ApiError(401, 'Cảnh báo an ninh: Phát hiện dấu hiệu gian lận phiên! Tất cả thiết bị đã được đăng xuất để bảo vệ tài khoản.');
    }

    // 5. KIỂM TRA EXPIRES (Hết hạn phiên)
    if (session.expiresAt < new Date()) {
      await sessionRepository.revokeById(session._id);
      throw new ApiError(401, 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
    }

    // 6. Tìm thông tin User sở hữu phiên
    const user = await userRepository.findById(session.userId);
    if (!user) {
      throw new ApiError(401, 'Tài khoản liên kết với phiên này không còn tồn tại.');
    }

    // 7. Sinh cặp Access Token và Refresh Token MỚI (Rotation)
    const tokenPayload = {
      id: user._id,
      tenantId: user.tenantId,
      role: user.role
    };

    const newAccessToken = signAccessToken(tokenPayload);
    const newPlainRefreshToken = signRefreshToken({ id: user._id });

    // 8. Băm SHA-256 Refresh Token MỚI
    const newTokenHash = hashRefreshToken(newPlainRefreshToken);

    // 9. UPDATE SESSION (Rotate Token): Cập nhật mã băm mới và gia hạn thời gian hết hạn
    const newExpiresAt = new Date(Date.now() + TOKEN_EXPIRY.REFRESH);
    await sessionRepository.updateSession(session._id, {
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
      ipAddress: context.ip || session.ipAddress,
      deviceInfo: context.ua || session.deviceInfo
    });

    // 10. Trả về Access Token mới và Refresh Token mới
    return {
      accessToken: newAccessToken,
      refreshToken: newPlainRefreshToken
    };
  }

  /**
   * 🔄 FLOW 4: LOGOUT (Hủy phiên)
   */
  async logout(userId, tenantId, plainRefreshToken, context) {
    let sessionRevoked = false;

    // 1. Nếu có Refresh Token truyền lên, băm SHA-256 và thu hồi Session tương ứng
    if (plainRefreshToken) {
      const tokenHash = hashRefreshToken(plainRefreshToken);
      const revokedSession = await sessionRepository.revokeByTokenHash(tokenHash);
      if (revokedSession) {
        sessionRevoked = true;
      }
    }

    // 2. Ghi Audit Log hành động Đăng xuất thành công
    await auditLogRepository.createLog({
      tenantId,
      userId,
      action: AUDIT_ACTIONS.LOGOUT,
      ipAddress: context.ip,
      userAgent: context.ua,
      status: AUDIT_STATUS.SUCCESS,
      metadata: { 
        sessionRevoked,
        loggedOutAt: new Date()
      }
    });

    return true;
  }

  /**
   * 🔄 FLOW 5: VERIFY EMAIL (Kích hoạt hòm thư)
   */
  async verifyEmail(plainToken, context) {
  if (!plainToken) {
    throw new ApiError(400, 'Mã kích hoạt không được để trống.');
  }

  // 1. Hash token nhận từ URL để đối soát DB
  const tokenHash = hashVerificationToken(plainToken);
  const tokenDoc = await tokenRepository.findOne({ 
    tokenHash, 
    type: TOKEN_TYPES.VERIFY_EMAIL 
  });

  if (!tokenDoc) {
    throw new ApiError(400, 'Mã kích hoạt không hợp lệ hoặc đã được sử dụng.');
  }

  if (tokenDoc.expiresAt < new Date()) {
    await tokenRepository.delete(tokenDoc._id);
    throw new ApiError(400, 'Mã kích hoạt đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực.');
  }

  // 2. Cấu hình Session / Transaction linh hoạt theo môi trường MongoDB
  const session = await mongoose.startSession();
  const topologyType = session.client?.topology?.description?.type || '';
  const isReplicaSet = topologyType.includes('ReplicaSet') || topologyType.includes('Sharded');

  if (isReplicaSet) {
    session.startTransaction();
  }

  const sessionOption = isReplicaSet ? { session } : {};

  try {
    // Cập nhật trạng thái user thành đã kích hoạt
    await userRepository.update(tokenDoc.userId, { isVerified: true }, sessionOption);

    // Xóa token kích hoạt sau khi dùng xong
    await tokenRepository.delete(tokenDoc._id, sessionOption);

    // Ghi log kiểm toán
    await auditLogRepository.createLog({
      userId: tokenDoc.userId,
      action: AUDIT_ACTIONS.VERIFY_EMAIL,
      ipAddress: context.ip,
      userAgent: context.ua,
      status: AUDIT_STATUS.SUCCESS
    }, sessionOption);

    if (isReplicaSet) {
      await session.commitTransaction();
    }
    session.endSession();

    return true;
  } catch (error) {
    if (isReplicaSet) {
      await session.abortTransaction();
    }
    session.endSession();
    throw error;
  }
}

  /**
   * 🔄 FLOW 6: FORGOT PASSWORD (Yêu cầu khôi phục)
   */
  async forgotPassword(email, context) {
    const cleanEmail = email.toLowerCase().trim();

    // 1. Kiểm tra sự tồn tại của User trong Database
    const user = await userRepository.findByEmail(cleanEmail);

    // ANTI-ENUMERATION SECURITY: Nếu email không tồn tại, vẫn ghi AuditLog FAILED ngầm và trả về true
    if (!user) {
      await auditLogRepository.createLog({
        email: cleanEmail,
        action: AUDIT_ACTIONS.PASSWORD_RESET_REQUEST,
        ipAddress: context.ip,
        userAgent: context.ua,
        status: AUDIT_STATUS.FAILED,
        metadata: { reason: 'EMAIL_NOT_FOUND' }
      });

      // Trả về true để Controller báo thành công chung cho Client, tránh lộ thông tin email đã đăng ký
      return true;
    }

    // 2. Dọn dẹp tất cả các Reset Tokens chưa sử dụng trước đó của User này
    await tokenRepository.deleteMany({
      userId: user._id,
      type: TOKEN_TYPES.PASSWORD_RESET
    });

    // 3. Sinh Reset Token thô ngẫu nhiên bảo mật cao (32 bytes = 64 ký tự hex)
    const plainResetToken = crypto.randomBytes(32).toString('hex');

    // 4. Băm SHA-256 Reset Token trước khi lưu vào Database
    const tokenHash = hashVerificationToken(plainResetToken);

    // 5. Lưu Token vào Collection Tokens với thời gian hết hạn khẩn cấp (15 phút)
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.PASSWORD_RESET);
    await tokenRepository.create({
      userId: user._id,
      tokenHash,
      type: TOKEN_TYPES.PASSWORD_RESET,
      expiresAt
    });

    // 6. Ghi Audit Log yêu cầu khôi phục mật khẩu thành công
    await auditLogRepository.createLog({
      tenantId: user.tenantId,
      userId: user._id,
      email: cleanEmail,
      action: AUDIT_ACTIONS.PASSWORD_RESET_REQUEST,
      ipAddress: context.ip,
      userAgent: context.ua,
      status: AUDIT_STATUS.SUCCESS,
      metadata: { expiresAt }
    });

    // 7. Gửi Email hướng dẫn đặt lại mật khẩu qua Resend (Non-blocking Task)
    emailService.sendPasswordResetEmail({
      email: cleanEmail,
      name: user.name,
      token: plainResetToken
    }).catch(err => console.error('❌ Lỗi gửi mail reset password ngầm:', err.message));

    return true;
  }

  /**
   * 🔄 FLOW 7: RESET PASSWORD (Đặt mật khẩu mới)
   */
  /**
   * 🚀 LUỒNG RESET PASSWORD HOÀN CHỈNH
   */
  async resetPassword(plainToken, newPassword, context) {
    if (!plainToken) {
      throw new ApiError(400, 'Mã khôi phục mật khẩu không được để trống.');
    }

    // 1. Băm SHA-256 token thô truyền lên từ Query để tìm kiếm trong Database
    const tokenHash = hashVerificationToken(plainToken);

    // 2. Tra cứu Token khôi phục trong Database
    const tokenDoc = await tokenRepository.findByTokenHash(tokenHash, TOKEN_TYPES.PASSWORD_RESET);

    // TRƯỜNG HỢP 1: Token không tồn tại (Sai token hoặc đã được sử dụng trước đó)
    if (!tokenDoc) {
      await auditLogRepository.createLog({
        action: AUDIT_ACTIONS.PASSWORD_RESET,
        ipAddress: context.ip,
        userAgent: context.ua,
        status: AUDIT_STATUS.FAILED,
        metadata: { reason: 'INVALID_OR_USED_TOKEN' }
      });
      throw new ApiError(400, 'Mã khôi phục mật khẩu không hợp lệ hoặc đã được sử dụng.');
    }

    // TRƯỜNG HỢP 2: Token đã vượt quá thời gian hết hạn (15 phút)
    if (tokenDoc.expiresAt < new Date()) {
      // Dọn dẹp bản ghi token hết hạn
      await tokenRepository.deleteById(tokenDoc._id);

      await auditLogRepository.createLog({
        userId: tokenDoc.userId,
        action: AUDIT_ACTIONS.PASSWORD_RESET,
        ipAddress: context.ip,
        userAgent: context.ua,
        status: AUDIT_STATUS.FAILED,
        metadata: { reason: 'EXPIRED_TOKEN' }
      });
      throw new ApiError(400, 'Mã khôi phục mật khẩu đã hết hạn. Vui lòng gửi lại yêu cầu mới.');
    }

    // Lấy thông tin User liên kết với Token
    const user = await userRepository.findByIdWithPassword(tokenDoc.userId);
    if (!user) {
      throw new ApiError(404, 'Tài khoản người dùng liên kết không còn tồn tại.');
    }

    // 3. Băm mật khẩu mới bằng Bcrypt (Salt Rounds = 10)
    const hashedPassword = await hashPassword(newPassword);

    // 4. Mở Mongoose Transaction thực thi đồng bộ 4 thao tác quan trọng
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // STEP A: Cập nhật mật khẩu đã băm vào UserRepository
      await userRepository.update(user._id, { password: hashedPassword }, { session });

      // STEP B: Revoke TOÀN BỘ các Session làm việc hiện tại của User trên mọi thiết bị
      await sessionRepository.revokeAllUserSessions(user._id, { session });

      // STEP C: Xóa Reset Token đã dùng khỏi Database
      await tokenRepository.deleteById(tokenDoc._id, { session });

      // STEP D: Ghi Audit Log hành động Đặt lại mật khẩu thành công
      await auditLogRepository.createLog({
        tenantId: user.tenantId,
        userId: user._id,
        email: user.email,
        action: AUDIT_ACTIONS.PASSWORD_RESET,
        ipAddress: context.ip,
        userAgent: context.ua,
        status: AUDIT_STATUS.SUCCESS,
        metadata: { resetAt: new Date() }
      }, { session });

      // STEP E: Commit Transaction
      await session.commitTransaction();
      session.endSession();

      return true;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async getCurrentUser(userId, tenantId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ApiError(404, 'Không tìm thấy thông tin người dùng.');
  }

  const tenant = await tenantRepository.findById(tenantId);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    },
    tenant: tenant ? {
      id: tenant._id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status
    } : null
  };
}
}

export default new AuthService();