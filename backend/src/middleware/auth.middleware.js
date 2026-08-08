import { verifyAccessToken } from '../utils/jwt.util.js';
import ApiError from '../utils/apiError.util.js';

/**
 * Middleware gác cổng tối cao kiểm tra mã xác thực JWT Access Token ngắn hạn
 */
export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // 1. Kiểm tra định dạng Header Authorization: Bearer <Token>
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError(401, 'Yêu cầu xác thực tài khoản. Vui lòng đính kèm mã truy cập hợp lệ.'));
    }
    
    const accessToken = authHeader.split(' ')[1];
    
    // 2. Thực thi giải mã chữ ký bảo mật từ lớp tiện ích Utilities
    try {
      const decodedPayload = verifyAccessToken(accessToken);
      
      // 3. TIÊM HỆ TRỤC TỌA ĐỘ MULTI-TENANT VÀO REQUEST PIPELINE
      // Từ đây, mọi Controller và Service phía sau đều có thể gọi req.user.tenantId một cách an toàn
      req.user = {
        id: decodedPayload.id,
        tenantId: decodedPayload.tenantId,
        role: decodedPayload.role
      };
      
      next();
    } catch (jwtError) {
      // Bẫy lỗi và bắn mã lỗi 401 cụ thể để Frontend ReactJS kích hoạt luồng gọi API refresh-token ngầm
      return next(new ApiError(401, jwtError.message || 'Mã truy cập không hợp lệ hoặc đã hết hạn.'));
    }
  } catch (error) {
    next(error);
  }
};