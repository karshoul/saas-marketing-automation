import Membership from '../models/Membership.js';
import Tenant from '../models/Tenant.js';
import Plan from '../models/Plan.js';
import Subscription from '../models/Subscription.js';
import ApiError from '../utils/apiError.util.js';
import mongoose from 'mongoose';

export const requireWorkspaceRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || req.user?._id;
      let tokenTenantId = req.user?.tenantId;
      let headerTenantId = req.headers['x-workspace-id'];

      console.log('\n--- 🔍 [MIDDLEWARE TRACE CHECK] ---');
      console.log('👤 User ID thực hiện request:', userId);
      console.log('🎫 Tenant ID trong Token (JWT):', tokenTenantId);
      console.log('🌐 Header x-workspace-id gửi lên từ Frontend:', headerTenantId);

      if (!userId) {
        throw new ApiError(401, 'Không tìm thấy thông tin định danh phiên làm việc.');
      }

      // 🛡️ BẢO MẬT TUYỆT ĐỐI: Mặc định luôn ưu tiên tenantId từ Token của chính chủ. 
      // Chỉ cho phép dùng header nếu user có sở hữu hoặc thuộc về workspace đó thực sự.
      let tenantId = tokenTenantId;

      if (headerTenantId && headerTenantId !== 'undefined' && headerTenantId !== 'null' && mongoose.Types.ObjectId.isValid(headerTenantId)) {
        if (headerTenantId === tokenTenantId) {
          console.log('✅ Header khớp hoàn toàn với Token.');
          tenantId = headerTenantId;
        } else {
          // Kiểm tra xem header có phải là workspace do chính họ làm chủ hoặc có membership không
          const checkTenant = await Tenant.findById(headerTenantId);
          const isOwner = checkTenant && checkTenant.ownerId?.toString() === userId.toString();
          const checkMembership = await Membership.findOne({ tenantId: headerTenantId, userId, status: 'ACTIVE' });

          if (isOwner || checkMembership) {
            console.log('⚠️ CẢNH BÁO: User đang chuyển sang một Workspace khác hợp lệ qua header:', headerTenantId);
            tenantId = headerTenantId;
          } else {
            console.log('❌ BỎ QUA HEADER RÁC: User không có quyền ở workspace trong header! Ép về Token tenantId:', tokenTenantId);
            tenantId = tokenTenantId; // Ép buộc quay về nhà chính chủ, chống lọt vào nhà người khác!
          }
        }
      }

      // Nếu vẫn chưa có tenantId, tiến hành tìm hoặc tạo mới workspace chính chủ
      if (!tenantId || tenantId === 'undefined' || tenantId === 'null') {
        let ownedTenant = await Tenant.findOne({ ownerId: userId });
        
        if (!ownedTenant) {
          const ownerMembership = await Membership.findOne({ userId: userId, role: 'OWNER', status: 'ACTIVE' });
          if (ownerMembership) {
            ownedTenant = await Tenant.findById(ownerMembership.tenantId);
          }
        }

        if (!ownedTenant) {
          const cleanEmail = req.user.email || 'user';
          const companyName = `${req.user.name || cleanEmail.split('@')[0]}'s Workspace`;
          const slug = cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString(36);

          ownedTenant = await Tenant.create({
            name: companyName,
            slug,
            ownerId: userId,
            status: 'TRIAL'
          });

          const freePlan = await Plan.findOne({ code: 'FREE' }) || await Plan.findOne();
          if (freePlan) {
            const trialDuration = 14 * 24 * 60 * 60 * 1000;
            await Subscription.create({
              tenantId: ownedTenant._id,
              planId: freePlan._id,
              status: 'TRIAL',
              billingCycle: 'MONTHLY',
              trialEnd: new Date(Date.now() + trialDuration),
              nextBillingDate: new Date(Date.now() + trialDuration),
              paymentProvider: 'NONE'
            });
          }
        }

        tenantId = ownedTenant._id.toString();
      }

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new ApiError(404, 'Không tìm thấy không gian làm việc (Workspace) trên hệ thống.');
      }

      const isTrueOwner = tenant.ownerId?.toString() === userId.toString();
      const targetRole = isTrueOwner ? 'OWNER' : 'ADMIN';

      const membership = await Membership.findOneAndUpdate(
        { 
          tenantId: new mongoose.Types.ObjectId(tenantId), 
          userId: new mongoose.Types.ObjectId(userId) 
        },
        { 
          $setOnInsert: { 
            tenantId: new mongoose.Types.ObjectId(tenantId), 
            userId: new mongoose.Types.ObjectId(userId), 
            role: targetRole,
            status: 'ACTIVE' 
          } 
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const effectiveRole = isTrueOwner ? 'OWNER' : membership.role;

      if (allowedRoles.length > 0 && !allowedRoles.includes(effectiveRole)) {
        throw new ApiError(
          403, 
          `Yêu cầu quyền hạn [${allowedRoles.join(', ')}]. Vai trò hiện tại của bạn là [${effectiveRole}].`
        );
      }

      console.log('🎯 [KẾT QUẢ MIDDLEWARE CHỐT]: Thao tác trên Tenant ID:', tenantId, '| Tên Workspace:', tenant.name, '| Role:', effectiveRole);
      console.log('----------------------------------------\n');

      req.membership = membership;
      req.workspaceRole = effectiveRole;
      req.user.tenantId = tenantId;

      next();
    } catch (error) {
      if (error.code === 11000) {
        try {
          const existing = await Membership.findOne({ tenantId, userId });
          if (existing) {
            req.membership = existing;
            req.workspaceRole = existing.role;
            req.user.tenantId = tenantId;
            return next();
          }
        } catch (innerErr) {
          return next(innerErr);
        }
      }
      console.error('💥 [ERROR WorkspaceAuth]:', error.message);
      next(error);
    }
  };
};