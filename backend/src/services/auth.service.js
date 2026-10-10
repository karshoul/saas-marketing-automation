import mongoose from 'mongoose';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

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
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';
import ApiError from '../utils/apiError.util.js';

// Constants
import { ROLES } from '../constants/auth/roles.js';
import { TOKEN_TYPES } from '../constants/auth/tokens.js';
import { PLAN_CODES } from '../constants/billing/plans.js';
import { SUBSCRIPTION_STATUS, PAYMENT_PROVIDERS, BILLING_CYCLES } from '../constants/billing/subscription.js';
import { AUDIT_ACTIONS } from '../constants/audit/actions.js';
import { AUDIT_STATUS } from '../constants/audit/status.js';
import { TENANT_STATUS } from '../constants/tenant/status.js';
import { TOKEN_EXPIRY } from '../constants/auth/tokens.js';

import Membership from '../models/Membership.js';

// Helper chuẩn hóa planSnapshot triệt để, ép kiểu primitive chống CastError
const buildSafePlanSnapshot = (freePlan) => ({
  code: String(freePlan?.code || PLAN_CODES.FREE || 'FREE'),
  version: Number(freePlan?.version || 1),
  limits: {
    maxContacts: Number(freePlan?.limits?.maxContacts ?? 1000),
    maxEmailsPerMonth: Number(freePlan?.limits?.maxEmailsPerMonth ?? 5000),
    maxCampaigns: Number(freePlan?.limits?.maxCampaigns ?? 10),
    maxWorkflows: Number(freePlan?.limits?.maxWorkflows ?? 5),
    maxTeamMembers: Number(freePlan?.limits?.maxTeamMembers ?? 2)
  },
  features: {
    analytics: Boolean(freePlan?.features?.analytics ?? true),
    customSMTP: Boolean(freePlan?.features?.customSMTP ?? false),
    apiAccess: Boolean(freePlan?.features?.apiAccess ?? false),
    webhook: Boolean(freePlan?.features?.webhook ?? false),
    automation: Boolean(freePlan?.features?.automation ?? false),
    aiAssistant: Boolean(freePlan?.features?.aiAssistant ?? false)
  }
});

class AuthService {
  
  /**
   * 🔄 FLOW 1: REGISTER (Bọc toàn cục trong ACID Database Transaction)
   */
  /**
   * 🔄 FLOW 1: REGISTER (Bọc toàn cục trong ACID Database Transaction)
   */
  async register(registerDto, context) {
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

    const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const existingTenant = await tenantRepository.findOne({ slug });
    if (existingTenant) {
      throw new ApiError(400, 'Tên doanh nghiệp trùng lặp slug URL. Vui lòng chọn tên khác.');
    }

    const freePlan = await planRepository.findByCode(PLAN_CODES.FREE);
    if (!freePlan) {
      throw new ApiError(500, 'Lỗi cấu hình Core: Hệ thống chưa thực hiện Seeding gói FREE.');
    }

    const session = await mongoose.startSession();
    const topologyType = session.client?.topology?.description?.type || '';
    const isReplicaSet = topologyType.includes('ReplicaSet') || topologyType.includes('Sharded');

    if (isReplicaSet) {
      session.startTransaction();
    }

    const sessionOption = isReplicaSet ? { session } : {};

    try {
      // 🔥 BƯỚC QUAN TRỌNG: Khởi tạo trước ObjectId cho User để thỏa mãn validation ownerId của Tenant
      const userId = new mongoose.Types.ObjectId();

      // --- STEP A: Tạo Tenant với ownerId chính chủ ngay từ đầu ---
      const tenant = await tenantRepository.create({
        name: companyName,
        slug,
        ownerId: userId, // 👈 Đã có ownerId, không còn bị lỗi required!
        status: TENANT_STATUS.TRIAL
      }, sessionOption);
      const tenantId = tenant._id;

      // --- STEP B: Tạo Subscription ---
      const trialDuration = 14 * 24 * 60 * 60 * 1000;
      await subscriptionRepository.create({
        tenantId,
        planId: freePlan._id,
        status: SUBSCRIPTION_STATUS.TRIAL,
        billingCycle: BILLING_CYCLES.MONTHLY,
        trialEnd: new Date(Date.now() + trialDuration),
        nextBillingDate: new Date(Date.now() + trialDuration),
        paymentProvider: PAYMENT_PROVIDERS.NONE,
        planSnapshot: buildSafePlanSnapshot(freePlan)
      }, sessionOption);

      // --- STEP C: Tạo User OWNER gắn với _id đã định nghĩa trước ---
      const hashedPassword = await hashPassword(password);
      const user = await userRepository.create({
        _id: userId, // 👈 Gắn đúng ID đã gán làm ownerId ở trên
        tenantId,
        name,
        email: cleanEmail,
        password: hashedPassword,
        role: ROLES.OWNER,
        isVerified: true
      }, sessionOption);

      // --- STEP D: Tạo bản ghi Membership vai trò OWNER ---
      await Membership.create([{
        tenantId,
        userId,
        role: ROLES.OWNER,
        status: 'ACTIVE'
      }], sessionOption);

      // --- STEP E: Tạo Session & Token ---
      const tokenPayload = { id: userId, tenantId, role: user.role, email: user.email };
      const accessToken = signAccessToken(tokenPayload);
      const plainRefreshToken = signRefreshToken({ id: userId });
      const refreshTokenHash = hashRefreshToken(plainRefreshToken);

      await sessionRepository.create({
        userId,
        tenantId,
        tokenHash: refreshTokenHash,
        deviceInfo: context.ua || 'Unknown Device',
        ipAddress: context.ip || '127.0.0.1',
        fingerprint: context.fingerprint || 'default_fingerprint',
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY.REFRESH)
      }, sessionOption);

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

      if (isReplicaSet) {
        await session.commitTransaction();
      }
      session.endSession();

      return {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isSuperAdmin: Boolean(user.isSuperAdmin),
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
      if (isReplicaSet) {
        await session.abortTransaction();
      }
      session.endSession();
      throw error;
    }
  }

  /**
   * 🔄 FLOW 2: LOGIN (Đảm bảo 100% luôn vào workspace gốc của chính mình)
   */
  /**
   * 🔄 FLOW 2: LOGIN (Đảm bảo 100% luôn vào workspace gốc của chính mình kèm log truy vết)
   */
  async login(loginDto, context) {
    const { email, password, deviceInfo, fingerprint } = loginDto;
    const cleanEmail = email.toLowerCase().trim();

    console.log('\n================ [1. BẮT ĐẦU LOGIN] ================');
    console.log('📧 Email đăng nhập:', cleanEmail);

    // 1. Tìm user theo email
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

    console.log('👤 Đã tìm thấy User ID:', user._id.toString());

    // 2. Chặn lỗi khi tài khoản được tạo qua Google OAuth (không có password)
    if (!user.password) {
      throw new ApiError(
        400,
        'Tài khoản này được đăng ký thông qua Google. Vui lòng bấm "Đăng nhập bằng Google" hoặc sử dụng chức năng "Quên mật khẩu" để thiết lập mật khẩu mới.'
      );
    }

    // 3. So khớp mật khẩu an toàn
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

    // 4. Tìm Workspace chính chủ bằng ownerId
let ownedTenant = await tenantRepository.findOne({ ownerId: user._id });

// Nếu user chưa sở hữu Workspace nào, tự động tạo mới hoàn toàn
if (!ownedTenant) {
  const freePlan = await planRepository.findByCode(PLAN_CODES.FREE);
  const companyName = `${user.name || 'My'}'s Workspace`;
  const slug = cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString(36);

  ownedTenant = await tenantRepository.create({
    name: companyName,
    slug,
    ownerId: user._id, // 🔥 Đã được lưu vào DB nhờ schema mới
    status: TENANT_STATUS.TRIAL
  });

  if (freePlan) {
    const trialDuration = 14 * 24 * 60 * 60 * 1000;
    await subscriptionRepository.create({
      tenantId: ownedTenant._id,
      planId: freePlan._id,
      status: SUBSCRIPTION_STATUS.TRIAL,
      billingCycle: BILLING_CYCLES.MONTHLY,
      trialEnd: new Date(Date.now() + trialDuration),
      nextBillingDate: new Date(Date.now() + trialDuration),
      paymentProvider: PAYMENT_PROVIDERS.NONE,
      planSnapshot: buildSafePlanSnapshot(freePlan)
    });
  }

  await userRepository.update(user._id, { tenantId: ownedTenant._id });
}

const tenantIdToUse = ownedTenant._id;
const currentRole = ROLES.OWNER;

    console.log('🔑 Workspace ID sẽ đưa vào Token (tenantIdToUse):', tenantIdToUse.toString());

    // Đảm bảo bảng Membership luôn có bản ghi OWNER chính thức cho workspace này
    await Membership.findOneAndUpdate(
      { tenantId: tenantIdToUse, userId: user._id },
      { role: ROLES.OWNER, status: 'ACTIVE' },
      { upsert: true, new: true }
    );

    const tokenPayload = {
      id: user._id,
      tenantId: tenantIdToUse,
      role: currentRole,
      email: user.email
    };

    const accessToken = signAccessToken(tokenPayload);
    const plainRefreshToken = signRefreshToken({ id: user._id });
    const refreshTokenHash = hashRefreshToken(plainRefreshToken);

    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.REFRESH);
    
    await sessionRepository.create({
      userId: user._id,
      tenantId: tenantIdToUse, 
      tokenHash: refreshTokenHash,
      deviceInfo: deviceInfo || context.ua || 'Unknown Device',
      ipAddress: context.ip || '127.0.0.1',
      fingerprint: fingerprint || 'default_fingerprint',
      expiresAt
    });

    await auditLogRepository.createLog({
      tenantId: tenantIdToUse,
      userId: user._id,
      email: cleanEmail,
      action: AUDIT_ACTIONS.LOGIN,
      ipAddress: context.ip,
      userAgent: context.ua,
      status: AUDIT_STATUS.SUCCESS,
      metadata: { deviceInfo: deviceInfo || context.ua }
    });

    const tenant = await tenantRepository.findById(tenantIdToUse);
    console.log('================ [HOÀN TẤT LOGIN] =================\n');

    return {
      user: {
        id: user._id,
        tenantId: tenantIdToUse,
        name: user.name,
        email: user.email,
        role: currentRole,
        isSuperAdmin: Boolean(user.isSuperAdmin),
        isVerified: user.isVerified
      },
      tenant: tenant ? {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug
      } : null,
      accessToken,
      refreshToken: plainRefreshToken
    };
  }

  /**
   * 🔄 FLOW: LOGIN WITH GOOGLE (Đảm bảo 100% luôn vào workspace gốc của chính mình)
   */
  async loginWithGoogle(credential, context) {
    try {
      if (!credential) {
        throw new ApiError(400, 'Mã Google Credential không được để trống.');
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.error('💥 [Google Auth]: GOOGLE_CLIENT_ID chưa được định nghĩa trong .env');
        throw new ApiError(500, 'Cấu hình Google Client ID trên máy chủ bị thiếu.');
      }

      const client = new OAuth2Client(clientId);

      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId
      });

      const payload = ticket.getPayload();
      
      const email = payload?.email;
      const name = payload?.name || payload?.given_name || (email ? email.split('@')[0] : 'Google User');
      const googleId = payload?.sub;
      const picture = payload?.picture;

      if (!email) {
        throw new ApiError(400, 'Không thể trích xuất địa chỉ email từ mã xác thực Google.');
      }

      const cleanEmail = email.toLowerCase().trim();

      const superAdminEmails = ["khuongnguyenbevis@gmail.com"];
      const isSystemAdmin = superAdminEmails.includes(cleanEmail);

      let user = await userRepository.findByEmail(cleanEmail);
      let tenant;

      const freePlan = await planRepository.findByCode(PLAN_CODES.FREE);
      if (!freePlan) {
        throw new ApiError(500, 'Lỗi Core: Hệ thống chưa thực hiện Seeding gói FREE.');
      }

      const session = await mongoose.startSession();
      const topologyType = session.client?.topology?.description?.type || '';
      const isReplicaSet = topologyType.includes('ReplicaSet') || topologyType.includes('Sharded');

      if (isReplicaSet) session.startTransaction();
      const sessionOption = isReplicaSet ? { session } : {};

      try {
        if (!user) {
          // ================= TRƯỜNG HỢP 1: USER CHƯA TỒN TẠI (ĐĂNG KÝ MỚI QUA GOOGLE) =================
          const companyName = `${name}'s Workspace`;
          const slug = cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString(36);

          // 🔥 Khởi tạo trước userId
          const newUserId = new mongoose.Types.ObjectId();

          tenant = await tenantRepository.create({
            name: companyName,
            slug,
            ownerId: newUserId, // 👈 Gán ownerId ngay tại đây
            status: TENANT_STATUS.TRIAL
          }, sessionOption);

          const trialDuration = 14 * 24 * 60 * 60 * 1000;
          await subscriptionRepository.create({
            tenantId: tenant._id,
            planId: freePlan._id,
            status: SUBSCRIPTION_STATUS.TRIAL,
            billingCycle: BILLING_CYCLES.MONTHLY,
            trialEnd: new Date(Date.now() + trialDuration),
            nextBillingDate: new Date(Date.now() + trialDuration),
            paymentProvider: PAYMENT_PROVIDERS.NONE,
            planSnapshot: buildSafePlanSnapshot(freePlan)
          }, sessionOption);

          // Tạo User định danh toàn cầu với _id đã khởi tạo trước
          user = await userRepository.create({
            _id: newUserId,
            name,
            email: cleanEmail,
            googleId,
            avatar: picture,
            isVerified: true,
            isSuperAdmin: isSystemAdmin,
            role: ROLES.OWNER
          }, sessionOption);

          await Membership.create([{
            tenantId: tenant._id,
            userId: user._id,
            role: ROLES.OWNER,
            status: 'ACTIVE'
          }], sessionOption);

          await tenantRepository.update(tenant._id, { ownerId: user._id }, sessionOption);

        } else {
          // ================= TRƯỜNG HỢP 2: USER ĐÃ TỒN TẠI =================
          let ownedTenant = await tenantRepository.findOne({ ownerId: user._id });
          if (!ownedTenant) {
            const ownerMembership = await Membership.findOne({ userId: user._id, role: ROLES.OWNER, status: 'ACTIVE' });
            if (ownerMembership) {
              ownedTenant = await tenantRepository.findById(ownerMembership.tenantId);
              if (ownedTenant && !ownedTenant.ownerId) {
                await tenantRepository.update(ownedTenant._id, { ownerId: user._id }, sessionOption);
              }
            }
          }

          // Nếu user này hoàn toàn chưa có workspace riêng, tạo mới ngay lập tức
          if (!ownedTenant) {
            const companyName = `${user.name || name}'s Workspace`;
            const slug = cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString(36);

            ownedTenant = await tenantRepository.create({
              name: companyName,
              slug,
              ownerId: user._id,
              status: TENANT_STATUS.TRIAL
            }, sessionOption);

            const trialDuration = 14 * 24 * 60 * 60 * 1000;
            await subscriptionRepository.create({
              tenantId: ownedTenant._id,
              planId: freePlan._id,
              status: SUBSCRIPTION_STATUS.TRIAL,
              billingCycle: BILLING_CYCLES.MONTHLY,
              trialEnd: new Date(Date.now() + trialDuration),
              nextBillingDate: new Date(Date.now() + trialDuration),
              paymentProvider: PAYMENT_PROVIDERS.NONE,
              planSnapshot: buildSafePlanSnapshot(freePlan)
            }, sessionOption);
          }

          tenant = ownedTenant;

          await Membership.findOneAndUpdate(
            { tenantId: tenant._id, userId: user._id },
            { role: ROLES.OWNER, status: 'ACTIVE' },
            { upsert: true, new: true },
            sessionOption
          );

          const updates = { 
            tenantId: tenant._id,
            isSuperAdmin: isSystemAdmin || user.isSuperAdmin 
          };
          if (!user.googleId) updates.googleId = googleId;
          if (!user.avatar && picture) updates.avatar = picture;
          if (!user.isVerified) updates.isVerified = true;

          await userRepository.update(user._id, updates, sessionOption);
          user = { ...user.toObject?.() || user, ...updates };
        }

        if (isReplicaSet) await session.commitTransaction();
        session.endSession();
      } catch (txnError) {
        if (isReplicaSet) await session.abortTransaction();
        session.endSession();
        throw txnError;
      }

      const currentRole = ROLES.OWNER;

      const tokenPayload = {
        id: user._id,
        tenantId: tenant._id,
        role: currentRole,
        email: user.email,
        isSuperAdmin: Boolean(user.isSuperAdmin)
      };

      const accessToken = signAccessToken(tokenPayload);
      const plainRefreshToken = signRefreshToken({ id: user._id });
      const refreshTokenHash = hashRefreshToken(plainRefreshToken);

      await sessionRepository.create({
        userId: user._id,
        tenantId: tenant._id,
        tokenHash: refreshTokenHash,
        deviceInfo: context.ua || 'Google Sign-In Device',
        ipAddress: context.ip || '127.0.0.1',
        fingerprint: context.fingerprint || 'google_auth_fingerprint',
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY.REFRESH)
      });

      await auditLogRepository.createLog({
        tenantId: tenant._id,
        userId: user._id,
        email: cleanEmail,
        action: AUDIT_ACTIONS.LOGIN,
        ipAddress: context.ip,
        userAgent: context.ua,
        status: AUDIT_STATUS.SUCCESS,
        metadata: { provider: 'GOOGLE_OAUTH' }
      });

      return {
        user: {
          id: user._id,
          tenantId: tenant._id,
          name: user.name,
          email: user.email,
          role: currentRole,
          isSuperAdmin: Boolean(user.isSuperAdmin),
          avatar: picture || user.avatar,
          isVerified: true
        },
        tenant: tenant ? {
          id: tenant._id,
          name: tenant.name,
          slug: tenant.slug
        } : null,
        accessToken,
        refreshToken: plainRefreshToken
      };

    } catch (error) {
      console.error('💥 [CHI TIẾT LỖI GOOGLE AUTH BACKEND]:', error);
      throw error;
    }
  }

  async logoutAllDevices(userId, tenantId, context) {
    const result = await sessionRepository.revokeAllUserSessions(userId);

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
   * 🔄 FLOW 3: REFRESH TOKEN
   */
  async refreshAccessToken(plainRefreshToken, context) {
    if (!plainRefreshToken) {
      throw new ApiError(401, 'Yêu cầu không hợp lệ. Vắng mặt Refresh Token trong phiên.');
    }

    try {
      verifyRefreshToken(plainRefreshToken);
    } catch (error) {
      throw new ApiError(401, 'Refresh Token không hợp lệ hoặc đã bị can thiệp.');
    }

    const tokenHash = hashRefreshToken(plainRefreshToken);
    const session = await sessionRepository.findByTokenHash(tokenHash);

    if (!session) {
      throw new ApiError(401, 'Phiên làm việc không tồn tại hoặc đã bị đăng xuất.');
    }

    if (session.isRevoked) {
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

    if (session.expiresAt < new Date()) {
      await sessionRepository.revokeById(session._id);
      throw new ApiError(401, 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
    }

    const user = await userRepository.findById(session.userId);
    if (!user) {
      throw new ApiError(401, 'Tài khoản liên kết với phiên này không còn tồn tại.');
    }

    const tokenPayload = {
      id: user._id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email
    };

    const newAccessToken = signAccessToken(tokenPayload);
    const newPlainRefreshToken = signRefreshToken({ id: user._id });
    const newTokenHash = hashRefreshToken(newPlainRefreshToken);

    const newExpiresAt = new Date(Date.now() + TOKEN_EXPIRY.REFRESH);
    await sessionRepository.updateSession(session._id, {
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
      ipAddress: context.ip || session.ipAddress,
      deviceInfo: context.ua || session.deviceInfo
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newPlainRefreshToken
    };
  }

  /**
   * 🔄 FLOW 4: LOGOUT
   */
  async logout(userId, tenantId, plainRefreshToken, context) {
    let sessionRevoked = false;

    if (plainRefreshToken) {
      const tokenHash = hashRefreshToken(plainRefreshToken);
      const revokedSession = await sessionRepository.revokeByTokenHash(tokenHash);
      if (revokedSession) {
        sessionRevoked = true;
      }
    }

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
   * 🔄 FLOW 5: VERIFY EMAIL
   */
  async verifyEmail(plainToken, context) {
    if (!plainToken) {
      throw new ApiError(400, 'Mã kích hoạt không được để trống.');
    }

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

    const session = await mongoose.startSession();
    const topologyType = session.client?.topology?.description?.type || '';
    const isReplicaSet = topologyType.includes('ReplicaSet') || topologyType.includes('Sharded');

    if (isReplicaSet) {
      session.startTransaction();
    }

    const sessionOption = isReplicaSet ? { session } : {};

    try {
      await userRepository.update(tokenDoc.userId, { isVerified: true }, sessionOption);
      await tokenRepository.delete(tokenDoc._id, sessionOption);

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
   * 🔄 FLOW 6: FORGOT PASSWORD
   */
  async forgotPassword(email, context) {
    try {
      if (!email) {
        throw new ApiError(400, 'Địa chỉ email không được để trống.');
      }

      const cleanEmail = email.toLowerCase().trim();
      const user = await userRepository.findByEmail(cleanEmail);

      // Nếu không tìm thấy user, trả về true luôn để tránh bị scan dò email (Security Best Practice)
      if (!user) {
        await auditLogRepository.createLog({
          email: cleanEmail,
          action: AUDIT_ACTIONS.PASSWORD_RESET_REQUEST,
          ipAddress: context?.ip || '127.0.0.1',
          userAgent: context?.ua || 'Unknown',
          status: AUDIT_STATUS.FAILED,
          metadata: { reason: 'EMAIL_NOT_FOUND' }
        });
        return true;
      }

      // 1. Xóa các token reset cũ nếu có
      await tokenRepository.deleteMany({
        userId: user._id,
        type: TOKEN_TYPES.PASSWORD_RESET
      });

      // 2. Tạo token ngẫu nhiên và mã hóa
      const plainResetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashVerificationToken(plainResetToken);
      
      // Fallback 15 phút nếu TOKEN_EXPIRY.PASSWORD_RESET không tồn tại
      const expiryDuration = TOKEN_EXPIRY?.PASSWORD_RESET || (15 * 60 * 1000);
      const expiresAt = new Date(Date.now() + expiryDuration);

      // 3. Lưu token vào DB
      await tokenRepository.create({
        userId: user._id,
        tokenHash,
        type: TOKEN_TYPES.PASSWORD_RESET,
        expiresAt
      });

      // 4. Ghi Audit Log
      await auditLogRepository.createLog({
        tenantId: user.tenantId,
        userId: user._id,
        email: cleanEmail,
        action: AUDIT_ACTIONS.PASSWORD_RESET_REQUEST,
        ipAddress: context?.ip || '127.0.0.1',
        userAgent: context?.ua || 'Unknown',
        status: AUDIT_STATUS.SUCCESS,
        metadata: { expiresAt }
      });

      // 5. Gửi email
      emailService.sendPasswordResetEmail({
        email: cleanEmail,
        name: user.name,
        token: plainResetToken
      }).catch(err => console.error('❌ Lỗi gửi mail reset password ngầm:', err));

      return true;
    } catch (error) {
      console.error('💥 [CHI TIẾT LỖI FORGOT PASSWORD]:', error);
      throw error;
    }
  }

  /**
   * 🔄 FLOW 7: RESET PASSWORD
   */
  async resetPassword(plainToken, newPassword, context) {
    if (!plainToken) {
      throw new ApiError(400, 'Mã khôi phục mật khẩu không được để trống.');
    }

    const tokenHash = hashVerificationToken(plainToken);
    const tokenDoc = await tokenRepository.findOne({ 
      tokenHash, 
      type: TOKEN_TYPES.PASSWORD_RESET 
    });

    if (!tokenDoc) {
      await auditLogRepository.createLog({
        action: AUDIT_ACTIONS.PASSWORD_RESET,
        ipAddress: context?.ip || '127.0.0.1',
        userAgent: context?.ua || 'Unknown',
        status: AUDIT_STATUS.FAILED,
        metadata: { reason: 'INVALID_OR_USED_TOKEN' }
      });
      throw new ApiError(400, 'Mã khôi phục mật khẩu không hợp lệ hoặc đã được sử dụng.');
    }

    if (tokenDoc.expiresAt < new Date()) {
      await tokenRepository.delete(tokenDoc._id);
      await auditLogRepository.createLog({
        userId: tokenDoc.userId,
        action: AUDIT_ACTIONS.PASSWORD_RESET,
        ipAddress: context?.ip || '127.0.0.1',
        userAgent: context?.ua || 'Unknown',
        status: AUDIT_STATUS.FAILED,
        metadata: { reason: 'EXPIRED_TOKEN' }
      });
      throw new ApiError(400, 'Mã khôi phục mật khẩu đã hết hạn. Vui lòng gửi lại yêu cầu mới.');
    }

    const user = await userRepository.findByIdWithPassword 
      ? await userRepository.findByIdWithPassword(tokenDoc.userId)
      : await userRepository.findById(tokenDoc.userId);

    if (!user) {
      throw new ApiError(404, 'Tài khoản người dùng liên kết không còn tồn tại.');
    }

    const hashedPassword = await hashPassword(newPassword);
    
    // Xử lý Transaction an toàn theo môi trường Mongo
    const session = await mongoose.startSession();
    const topologyType = session.client?.topology?.description?.type || '';
    const isReplicaSet = topologyType.includes('ReplicaSet') || topologyType.includes('Sharded');

    if (isReplicaSet) session.startTransaction();
    const sessionOption = isReplicaSet ? { session } : {};

    try {
      await userRepository.update(user._id, { password: hashedPassword }, sessionOption);
      await sessionRepository.revokeAllUserSessions(user._id);
      await tokenRepository.delete(tokenDoc._id, sessionOption);

      await auditLogRepository.createLog({
        tenantId: user.tenantId,
        userId: user._id,
        email: user.email,
        action: AUDIT_ACTIONS.PASSWORD_RESET,
        ipAddress: context?.ip || '127.0.0.1',
        userAgent: context?.ua || 'Unknown',
        status: AUDIT_STATUS.SUCCESS,
        metadata: { resetAt: new Date() }
      }, sessionOption);

      if (isReplicaSet) await session.commitTransaction();
      session.endSession();

      return true;
    } catch (error) {
      if (isReplicaSet) await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async getCurrentUser(userId, tenantId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'Không tìm thấy thông tin người dùng.');
    }

    const tenant = tenantId ? await tenantRepository.findById(tenantId) : null;

    // 🔥 TRUY VẤN MEMBERSHIP ĐỂ LẤY ROLE CHUẨN XÁC TRONG WORKSPACE HIỆN TẠI
    let currentRole = user.role;
    if (tenantId) {
      const membership = await Membership.findOne({ tenantId, userId });
      if (membership) {
        currentRole = membership.role;
      }
    }

    return {
      user: {
        id: user._id,
        tenantId: tenantId || user.tenantId,
        name: user.name,
        email: user.email,
        role: currentRole, // 👈 Trả về role chuẩn xác theo Workspace
        isSuperAdmin: Boolean(user.isSuperAdmin),
        isVerified: user.isVerified,
        avatar: user.avatar,
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