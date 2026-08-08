import rateLimit from 'express-rate-limit';
import ApiError from '../utils/apiError.util.js';

/**
 * Middleware giới hạn tần suất gửi Request cho các tuyến đường xác thực nhạy cảm (Đăng ký, Đăng nhập)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Cửa sổ thời gian tính theo mốc: 15 phút
  max: 30, // Tối đa 30 request từ một địa chỉ IP trong vòng 15 phút
  standardHeaders: true, // Trả về thông tin giới hạn trong headers `RateLimit-*`
  legacyHeaders: false, // Tắt các headers cũ X-RateLimit-*
  handler: (req, res, next) => {
    // Chuyển lệnh báo lỗi về phễu Global Error Handler tập trung qua ApiError
    next(new ApiError(429, 'Hệ thống phát hiện tần suất yêu cầu quá cao. Vui lòng chậm lại và thử lại sau 15 phút.'));
  }
});

/**
 * Middleware giới hạn tần suất chung cho toàn bộ các API Private khác
 */
export const globalRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // Cửa sổ thời gian: 1 phút
  max: 100, // Tối đa 100 request/phút
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Tần suất gửi yêu cầu vượt ngưỡng cho phép. Vui lòng thử lại sau ít phút.'));
  }
});