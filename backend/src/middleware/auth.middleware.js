import { verifyAccessToken } from '../utils/jwt.util.js';
import ApiError from '../utils/apiError.util.js';
import Membership from '../models/Membership.js';
import mongoose from 'mongoose';

/**
 * Middleware gác cổng tối cao kiểm tra mã xác thực JWT Access Token
 * và tự động chuyển ngữ cảnh Workspace nếu có yêu cầu override hợp lệ
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
        // Xác minh xem User này có thực sự là thành viên ACTIVE trong Workspace đó không
        const membership = await Membership.findOne({
          tenantId: requestedWorkspaceId,
          userId: userId,
          status: 'ACTIVE'
        });

        if (membership) {
          // 🔥 Chuyển ngữ cảnh sang Workspace được chọn cùng vai trò thực tế trong nhà đó
          effectiveTenantId = requestedWorkspaceId;
          effectiveRole = membership.role;
        } else {
          // Nếu cố tình gửi Workspace ID không thuộc về mình, bảo mật fallback về nhà gốc
          console.warn(`⚠️ [BẢO MẬT] User ${userId} cố truy cập trái phép Workspace: ${requestedWorkspaceId}`);
        }
      }
      
      // Tiêm đầy đủ thông tin ngữ cảnh vào request pipeline
      req.user = {
        id: userId,
        tenantId: effectiveTenantId,
        role: effectiveRole,
        email: decodedPayload.email
      };
      
      next();
    } catch (jwtError) {
      return next(new ApiError(401, jwtError.message || 'Mã truy cập không hợp lệ hoặc đã hết hạn.'));
    }
  } catch (error) {
    next(error);
  }
};