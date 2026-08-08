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

  // 2. Ghi logs vết lỗi ra Console của Server phục vụ kiểm soát, sửa lỗi (Debug)
  console.error(`💥 [API Error Log]: [${req.method}] ${req.path} | Status: ${statusCode} | Message: ${message}`);
  if (err.stack && env.nodeEnv === 'development') {
    console.error(err.stack); // In Stack Trace chi tiết ở môi trường Local
  }

  // 3. Chuẩn hóa cấu trúc và trả về Payload JSON đồng bộ qua response.util
  return errorResponse(res, statusCode, message, errors);
};