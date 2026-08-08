import AuditLog from '../models/AuditLog.js';

class AuditLogRepository {
  async createLog(logData, options = {}) {
    return await AuditLog.create([logData], options);
  }
}

export default new AuditLogRepository();