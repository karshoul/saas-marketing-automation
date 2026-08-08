/**
 * Chuẩn hóa phản hồi API thành công (Mã 200 OK)
 */
export const success = (res, message = 'Thao tác thành công', data = {}) => {
  return res.status(200).json({
    success: true,
    statusCode: 200,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Chuẩn hóa phản hồi API tạo mới thực thể thành công (Mã 201 Created)
 */
export const created = (res, message = 'Khởi tạo thực thể thành công', data = {}) => {
  return res.status(201).json({
    success: true,
    statusCode: 201,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Chuẩn hóa phản hồi lỗi chủ động (Mã lỗi 4xx/5xx tùy biến)
 */
export const error = (res, statusCode = 500, message = 'Lỗi hệ thống nội bộ', errors = null) => {
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });
};