/**
 * Lớp lỗi tùy biến dành cho API (Custom Operational Error Class)
 */
class ApiError extends Error {
  /**
   * Khởi tạo thực thể lỗi API
   * @param {number} statusCode - Mã trạng thái HTTP (e.g., 400, 401, 403, 404)
   * @param {string} message - Nội dung thông báo lỗi
   * @param {any} [errors=null] - Chi tiết mảng hoặc đối tượng lỗi (Dùng cho Joi/Zod Validation logs)
   * @param {string} [stack=''] - Stack Trace lịch sử chạy code
   */
  constructor(statusCode, message, errors = null, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;