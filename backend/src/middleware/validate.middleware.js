import { ZodError } from 'zod';
import ApiError from '../utils/apiError.util.js';

/**
 * Middleware tích hợp và chạy các bộ kiểm định Zod Schema đầu vào
 * @param {import('zod').ZodSchema} schema - Zod Schema tương ứng của Endpoint
 */
export const validateDto = (schema) => {
  return async (req, res, next) => {
    try {
      // Thực thi kiểm định dữ liệu body gửi lên
      const validatedData = await schema.parseAsync(req.body);
      
      // Ghi đè lại req.body bằng dữ liệu sạch đã qua sanitize
      req.body = validatedData;
      
      next();
    } catch (error) {
      // Bẫy chính xác lỗi từ Zod Engine (dùng instanceof hoặc error.name)
      if (error instanceof ZodError || error.name === 'ZodError') {
        // Zod lưu danh sách lỗi trong `issues` (hoặc `errors`)
        const issueList = error.issues || error.errors || [];
        
        const detailErrors = issueList.map(err => ({
          field: err.path ? err.path.join('.') : 'body',
          message: err.message
        }));
        
        return next(new ApiError(400, 'Dữ liệu yêu cầu gửi lên không hợp lệ.', detailErrors));
      }
      
      next(error);
    }
  };
};

export const validateMiddleware = validateDto;