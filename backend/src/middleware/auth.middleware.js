import { verifyAccessToken } from '../utils/jwt.util.js';
import ApiError from '../utils/apiError.util.js';
import Membership from '../models/Membership.js';
import Tenant from '../models/Tenant.js';
import mongoose from 'mongoose';

/**
 * Middleware gác cổng tối cao kiểm tra mã xác thực JWT Access Token,
 * tự động chuyển ngữ cảnh Workspace và CHẶN các Workspace bị tạm khóa (SUSPENDED).
 */
export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError(401, 'Yêu cầu xác thực tài khoản. Vui lòng đính kèm mã truy cập hợp lệ.'));
    }
    
    const accessToken = authHeader.split(' ')[1];
    
    try {
      const decodedPayload = verifyAccessToken(accessToken);
      const userId = decodedPayload.id || decodedPayload.userId;
      
      let effectiveTenantId = decodedPayload.tenantId;
      let effectiveRole = decodedPayload.role;

      // 🌐 KIỂM TRA HEADER X-WORKSPACE-ID ĐỂ HỖ TRỢ CHUYỂN WORKSPACE
      const requestedWorkspaceId = req.headers['x-workspace-id'];

      if (
        requestedWorkspaceId &&
        requestedWorkspaceId !== 'undefined' &&
        requestedWorkspaceId !== 'null' &&
        mongoose.Types.ObjectId.isValid(requestedWorkspaceId) &&
        requestedWorkspaceId !== effectiveTenantId?.toString()
      ) {
        const membership = await Membership.findOne({
          tenantId: requestedWorkspaceId,
          userId: userId,
          status: 'ACTIVE'
        });

        if (membership) {
          effectiveTenantId = requestedWorkspaceId;
          effectiveRole = membership.role;
        } else {
          console.warn(`⚠️ [BẢO MẬT] User ${userId} cố truy cập trái phép Workspace: ${requestedWorkspaceId}`);
        }
      }

      // 🛑 BỔ SUNG: Kiểm tra trạng thái Workspace trong DB (Bỏ qua đối với SuperAdmin)
      if (effectiveTenantId && !decodedPayload.isSuperAdmin && effectiveRole !== 'SUPER_ADMIN') {
        const tenantDoc = await Tenant.findById(effectiveTenantId).select('status');
        if (tenantDoc && (tenantDoc.status === 'SUSPENDED' || tenantDoc.status === 'suspended')) {
          return next(new ApiError(403, 'Không gian làm việc (Workspace) của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên để biết thêm chi tiết.'));
        }
      }
      
      // Tiêm đầy đủ thông tin ngữ cảnh vào request pipeline
      req.user = {
        id: userId,
        tenantId: effectiveTenantId,
        role: effectiveRole,
        email: decodedPayload.email,
        isSuperAdmin: Boolean(decodedPayload.isSuperAdmin)
      };
      
      next();
    } catch (jwtError) {
      return next(new ApiError(401, jwtError.message || 'Mã truy cập không hợp lệ hoặc đã hết hạn.'));
    }
  } catch (error) {
    next(error);
  }
};