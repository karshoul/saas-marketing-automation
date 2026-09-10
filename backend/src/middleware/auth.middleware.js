import { verifyAccessToken } from '../utils/jwt.util.js';
import ApiError from '../utils/apiError.util.js';

/**
 * Middleware gác cổng tối cao kiểm tra mã xác thực JWT Access Token ngắn hạn
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
      
      // Tiêm đầy đủ thông tin định danh vào request pipeline
      req.user = {
        id: decodedPayload.id || decodedPayload.userId,
        tenantId: decodedPayload.tenantId,
        role: decodedPayload.role,
        email: decodedPayload.email // BẮT BUỘC ĐÍNH KÈM EMAIL để admin.middleware nhận diện
      };
      
      next();
    } catch (jwtError) {
      return next(new ApiError(401, jwtError.message || 'Mã truy cập không hợp lệ hoặc đã hết hạn.'));
    }
  } catch (error) {
    next(error);
  }
};