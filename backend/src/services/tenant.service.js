import tenantRepository from '../repositories/tenant.repository.js';
import ApiError from '../utils/apiError.util.js';
import Membership from '../models/Membership.js';
import Tenant from '../models/Tenant.js';
import crypto from 'crypto';

class TenantService {
  async getTenantById(tenantId) {
    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) throw new ApiError(404, 'Không tìm thấy thông tin không gian làm việc (Workspace).');
    return tenant;
  }

  async updateTenant(tenantId, updateData) {
    return await tenantRepository.update(tenantId, updateData);
  }

  async getUserWorkspaces(userId) {
    const memberships = await Membership.find({ userId, status: 'ACTIVE' }).populate('tenantId');
    
    return memberships
      .filter((m) => m.tenantId != null)
      .map((m) => ({
        tenantId: m.tenantId._id,
        name: m.tenantId.name,
        slug: m.tenantId.slug,
        status: m.tenantId.status,
        role: m.role,
        joinedAt: m.joinedAt
      }));
  }

  async getMyTenantWithRole(tenantId, userId) {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) throw new ApiError(404, 'Không tìm thấy Workspace.');

    const membership = await Membership.findOne({ tenantId, userId });
    const role = membership 
      ? membership.role 
      : (tenant.ownerId?.toString() === userId.toString() ? 'OWNER' : 'MEMBER');

    return { tenant, role };
  }

  /**
   * Tạo mới / Xoay vòng Khóa API
   */
  async regenerateApiKey(tenantId) {
    const newApiKey = `vdo_live_${crypto.randomBytes(16).toString('hex')}`;
    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { apiKey: newApiKey },
      { new: true }
    );
    if (!tenant) throw new ApiError(404, 'Không tìm thấy không gian làm việc.');
    return newApiKey;
  }

  /**
   * Cập nhật cấu hình SMTP riêng
   */
  async updateSmtpConfig(tenantId, { host, port, user, pass, senderEmail }) {
    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      {
        smtpConfig: {
          host: host || '',
          port: port || 465,
          user: user || '',
          pass: pass || '',
          senderEmail: senderEmail || ''
        }
      },
      { new: true }
    );
    if (!tenant) throw new ApiError(404, 'Không tìm thấy không gian làm việc.');
    return tenant;
  }
}

export default new TenantService();