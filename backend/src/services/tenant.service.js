import tenantRepository from '../repositories/tenant.repository.js';
import ApiError from '../utils/apiError.util.js';

class TenantService {
  async getTenantById(tenantId) {
    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) throw new ApiError(404, 'Không tìm thấy thông tin không gian làm việc (Workspace).');
    return tenant;
  }

  async updateTenant(tenantId, updateData) {
    return await tenantRepository.update(tenantId, updateData);
  }
}

export default new TenantService();