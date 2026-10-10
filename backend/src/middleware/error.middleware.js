import { env } from '../config/env.js';
import { error as errorResponse } from '../utils/response.util.js';

/**
 * Middleware xử lý lỗi tập trung toàn cục (Global Error Handler Middleware)
 */
export const globalErrorHandler = (err, req, res, next) => {
  let { statusCode, message, errors } = err;

  // 1. Nếu là lỗi runtime thông thường chưa được bọc qua ApiError, ép về lỗi 500
  if (!statusCode) {
    statusCode = 500;
    message = env.nodeEnv === 'production' ? 'Lỗi hệ thống nội bộ' : err.message;
  }

  // 🔥 LUÔN IN TOÀN BỘ CHI TIẾT LỖI RA TERMINAL ĐỂ GỠ LỖI (Bỏ chặn điều kiện env)
  console.error('🔥 [DEBUG - LỖI GỐC CHI TIẾT]:', err);

  // 2. Ghi logs vết lỗi ra Console của Server
  console.error(`💥 [API Error Log]: [${req.method}] ${req.path} | Status: ${statusCode} | Message: ${message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  // 3. Chuẩn hóa cấu trúc và trả về Payload JSON đồng bộ
  return errorResponse(res, statusCode, message, errors);
};