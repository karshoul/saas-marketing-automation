import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { TOKEN_EXPIRY } from '../constants/auth/tokens.js';

/**
 * Ký mã Access Token ngắn hạn cho người dùng
 * @param {Object} payload - Dữ liệu định danh gồm id, tenantId, role
 * @returns {string} Chuỗi Access Token JWT
 */
export const signAccessToken = (payload) => {
  try {
    return jwt.sign(payload, env.jwt.accessSecret, {
      expiresIn: TOKEN_EXPIRY.ACCESS,
    });
  } catch (error) {
    throw new Error(`❌ [JWT Util Error]: Ký Access Token thất bại: ${error.message}`);
  }
};

/**
 * Ký mã Refresh Token dài hạn cho phiên làm việc
 * @param {Object} payload - Dữ liệu định danh cơ bản
 * @returns {string} Chuỗi Refresh Token JWT
 */
export const signRefreshToken = (payload) => {
  try {
    // Ép kiểu TOKEN_EXPIRY.REFRESH sang chuỗi tương thích JWT (e.g., '7d')
    const expiresInStr = typeof TOKEN_EXPIRY.REFRESH === 'number' 
      ? `${TOKEN_EXPIRY.REFRESH / (24 * 60 * 60 * 1000)}d` 
      : '7d';

    return jwt.sign(payload, env.jwt.refreshSecret, {
      expiresIn: expiresInStr,
    });
  } catch (error) {
    throw new Error(`❌ [JWT Util Error]: Ký Refresh Token thất bại: ${error.message}`);
  }
};

/**
 * Xác thực chuỗi Access Token
 * @param {string} token - Access Token cần kiểm tra
 * @returns {Object} Payload được giải mã
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.jwt.accessSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('⚠️ [Access Token Expired]: Mã Access Token đã hết hạn.');
    }
    throw new Error(`❌ [Access Token Invalid]: Mã Access Token không hợp lệ: ${error.message}`);
  }
};

/**
 * Xác thực chuỗi Refresh Token
 * @param {string} token - Refresh Token cần kiểm tra
 * @returns {Object} Payload được giải mã
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.jwt.refreshSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('⚠️ [Refresh Token Expired]: Mã Refresh Token đã hết hạn.');
    }
    throw new Error(`❌ [Refresh Token Invalid]: Mã Refresh Token không hợp lệ: ${error.message}`);
  }
};