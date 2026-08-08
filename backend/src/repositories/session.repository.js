import Session from '../models/Session.js';

class SessionRepository {
  /**
   * Khởi tạo Session mới (Xử lý an toàn cả Object lẫn Array)
   */
  async create(sessionData, options = {}) {
    if (Array.isArray(sessionData)) {
      return await Session.create(sessionData, options);
    }
    const sessionDoc = new Session(sessionData);
    return await sessionDoc.save(options);
  }

  /**
   * Tìm kiếm phiên theo mã băm Refresh Token
   */
  async findByTokenHash(tokenHash) {
    return await Session.findOne({ tokenHash, isRevoked: false });
  }

  /**
   * Cập nhật thông tin phiên (Dùng cho Token Rotation)
   */
  async updateSession(id, updateData, options = {}) {
    return await Session.findByIdAndUpdate(id, updateData, { new: true, ...options });
  }

  /**
   * Thu hồi 1 phiên cụ thể theo ID
   */
  async revokeById(id, options = {}) {
    return await Session.findByIdAndUpdate(
      id,
      { isRevoked: true, revokedAt: new Date() },
      { new: true, ...options }
    );
  }

  /**
   * Thu hồi 1 phiên cụ thể theo Token Hash
   */
  async revokeByTokenHash(tokenHash, options = {}) {
    return await Session.findOneAndUpdate(
      { tokenHash, isRevoked: false },
      { 
        $set: { 
          isRevoked: true, 
          revokedAt: new Date() 
        } 
      },
      { new: true, ...options }
    );
  }

  /**
   * Thu hồi toàn bộ phiên của một User (Hỗ trợ luồng "Logout All Devices" / Đổi mật khẩu)
   */
  async revokeAllUserSessions(userId, options = {}) {
    return await Session.updateMany(
      { userId, isRevoked: false },
      { 
        $set: { 
          isRevoked: true, 
          revokedAt: new Date() 
        } 
      },
      options
    );
  }
}

export default new SessionRepository();