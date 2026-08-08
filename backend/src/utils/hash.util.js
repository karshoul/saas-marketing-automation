import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

/**
 * Băm mật khẩu thô một chiều
 * @param {string} password - Mật khẩu thô
 * @returns {Promise<string>} Chuỗi mật khẩu đã băm
 */
export const hashPassword = async (password) => {
  if (!password) {
    throw new Error('❌ [Hash Util Error]: Mật khẩu thô không được để trống.');
  }
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * So khớp mật khẩu thô với cơ sở dữ liệu
 * @param {string} password - Mật khẩu thô Client gửi lên
 * @param {string} hashedPassword - Mật khẩu đã băm trong DB
 * @returns {Promise<boolean>} Kết quả đối soát
 */
export const comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) {
    throw new Error('❌ [Hash Util Error]: Thiếu tham số đối soát mật khẩu.');
  }
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Băm chuỗi SHA-256 cho mã Refresh Token trước khi lưu vào Session Collection
 * @param {string} token - Refresh Token thô
 * @returns {string} Chuỗi Hexadecimal mã băm 64 ký tự
 */
export const hashRefreshToken = (token) => {
  if (!token) {
    throw new Error('❌ [Hash Util Error]: Mã Refresh Token thô không được để trống.');
  }
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Băm chuỗi SHA-256 cho các mã xác thực (Verify Email Link, Reset Password OTP)
 * @param {string} token - Token thô dùng một lần
 * @returns {string} Chuỗi Hexadecimal mã băm 64 ký tự
 */
export const hashVerificationToken = (token) => {
  if (!token) {
    throw new Error('❌ [Hash Util Error]: Mã Token xác thực thô không được để trống.');
  }
  return crypto.createHash('sha256').update(token).digest('hex');
};