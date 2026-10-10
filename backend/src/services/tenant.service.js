import tenantRepository from '../repositories/tenant.repository.js';
import ApiError from '../utils/apiError.util.js';
import Membership from '../models/Membership.js';
import Tenant from '../models/Tenant.js';

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
    // Tìm tất cả các membership active của user và populate thông tin Tenant
    const memberships = await Membership.find({ userId, status: 'ACTIVE' }).populate('tenantId');
    
    return memberships
      .filter((m) => m.tenantId != null) // Lọc bỏ trường hợp tenant đã bị xóa
      .map((m) => ({
        tenantId: m.tenantId._id,
        name: m.tenantId.name,
        slug: m.tenantId.slug,
        status: m.tenantId.status,
        role: m.role, // 'OWNER' | 'ADMIN' | 'MEMBER'
        joinedAt: m.joinedAt
      }));
  }

  async getMyTenantWithRole(tenantId, userId) {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) throw new ApiError(404, 'Không tìm thấy Workspace.');

    // Tìm vai trò thực tế trong membership
    const membership = await Membership.findOne({ tenantId, userId });
    const role = membership
      ? membership.role
      : (tenant.ownerId?.toString() === userId.toString() ? 'OWNER' : 'MEMBER');

    return {
      tenant,
      role
    };
  }
}

export default new TenantService();