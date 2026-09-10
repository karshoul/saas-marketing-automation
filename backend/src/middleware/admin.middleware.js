import ApiError from '../utils/apiError.util.js';

export const requireSuperAdmin = (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      throw new ApiError(401, 'Yêu cầu đăng nhập để truy cập tài nguyên quản trị.');
    }

    // Cho phép nếu role là SUPERADMIN hoặc tài khoản admin hệ thống
    const isSuperAdmin =
      user.role === 'SUPERADMIN' ||
      user.isSuperAdmin === true ||
      user.email?.endsWith('@verdio.io') ||
      user.email === 'khuongnguyenbevis@gmail.com'; // Cho phép trực tiếp tài khoản admin của bạn

    if (!isSuperAdmin) {
      throw new ApiError(403, 'Từ chối truy cập: Bạn không có quyền SuperAdmin của nền tảng.');
    }

    next();
  } catch (error) {
    next(error);
  }
};