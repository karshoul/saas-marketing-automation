import ApiError from '../utils/apiError.util.js';

/**
 * Middleware thực thi hàng rào kiểm soát quyền hạn (Role-Based Access Control)
 * Hỗ trợ đồng thời quyền trong Workspace (req.workspaceRole) và quyền hệ thống (req.user.role)
 * @param {...string} allowedRoles - Danh sách các vai trò được phép (OWNER, ADMIN, MEMBER...)
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Đảm bảo request đã đi qua lớp authenticateUser trước đó
    if (!req.user) {
      return next(new ApiError(401, 'Yêu cầu xác thực danh tính trước khi phân quyền.'));
    }

    // Lấy role ưu tiên trong workspace hiện tại (nếu có qua workspace middleware)
    // Hoặc fallback về role tổng của tài khoản trên hệ thống
    const currentRole = req.workspaceRole || req.user.role;

    if (!currentRole || !allowedRoles.includes(currentRole)) {
      return next(
        new ApiError(
          403, 
          `FORBIDDEN: Yêu cầu quyền [${allowedRoles.join(', ')}]. Vai trò hiện tại của bạn là [${currentRole || 'NONE'}].`
        )
      );
    }

    next();
  };
};