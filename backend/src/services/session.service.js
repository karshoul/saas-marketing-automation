import sessionRepository from '../repositories/session.repository.js';
import { hashRefreshToken } from '../utils/hash.util.js';
import ApiError from '../utils/apiError.util.js';

class SessionService {
  /**
   * Đăng ký một phiên làm việc mới (Mã hóa SHA-256 mã thông báo)
   */
  async createSession({ userId, tenantId, plainRefreshToken, deviceInfo, ipAddress, fingerprint, expiresAt }) {
    const tokenHash = hashRefreshToken(plainRefreshToken);
    
    return await sessionRepository.create({
      userId,
      tenantId,
      tokenHash,
      deviceInfo: deviceInfo || 'Unknown Device',
      ipAddress: ipAddress || '127.0.0.1',
      fingerprint: fingerprint || 'default_fingerprint',
      expiresAt
    });
  }

  /**
   * Thu hồi một phiên làm việc cụ thể khi Logout
   */
  async revokeSession(plainRefreshToken) {
    const tokenHash = hashRefreshToken(plainRefreshToken);
    const revoked = await sessionRepository.revokeByTokenHash(tokenHash);
    if (!revoked) throw new ApiError(401, 'Phiên làm việc không tồn tại hoặc đã bị thu hồi từ trước.');
    return true;
  }

  /**
   * Xóa sạch toàn bộ phiên của một người dùng (Ví dụ khi đổi mật khẩu)
   */
  async clearAllUserSessions(userId) {
    return await sessionRepository.revokeAllUserSessions(userId);
  }
}

export default new SessionService();