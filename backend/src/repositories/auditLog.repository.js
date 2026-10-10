import AuditLog from '../models/AuditLog.js';

class AuditLogRepository {
  async createLog(logData, options = {}) {
    // 🔥 Tự động bọc vào mảng nếu truyền vào là Object đơn lẻ để tránh lỗi 500
    const dataArray = Array.isArray(logData) ? logData : [logData];
    return await AuditLog.create(dataArray, options);
  }
}

export default new AuditLogRepository();