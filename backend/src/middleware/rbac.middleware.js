import ApiError from '../utils/apiError.util.js';

/**
 * Cho phép các roles được chỉ định thực thi endpoint
 * @param  {...string} allowedRoles - Ví dụ: 'OWNER', 'ADMIN'
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Bạn không có quyền thực hiện thao tác này.'));
    }
    next();
  };
};