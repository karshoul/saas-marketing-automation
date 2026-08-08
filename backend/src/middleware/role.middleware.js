import ApiError from '../utils/apiError.util.js';

/**
 * Middleware thực thi hàng rào kiểm soát quyền hạn (Role-Based Access Control)
 * @param {...string} allowedRoles - Danh sách các vai trò được phép đi qua API này (OWNER, ADMIN...)
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Đảm bảo request đã đi qua lớp authenticateUser trước đó
    if (!req.user || !req.user.role) {
      return next(new ApiError(500, 'Lỗi thiết kế hệ thống: Middleware phân quyền yêu cầu phải đặt phía sau Middleware xác thực.'));
    }

    // Đối soát ma trận quyền hạn
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'FORBIDDEN: Tài khoản của bạn không có đủ thẩm quyền thực hiện thao tác này.'));
    }

    next();
  };
};