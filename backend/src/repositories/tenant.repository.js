import Tenant from '../models/Tenant.js';

class TenantRepository {
  async create(tenantData, options = {}) {
    if (Array.isArray(tenantData)) {
      return await Tenant.create(tenantData, options);
    }
    const tenantDoc = new Tenant(tenantData);
    return await tenantDoc.save(options);
  }

  async findById(id) {
    return await Tenant.findById(id);
  }

  async findBySlug(slug) {
    return await Tenant.findOne({ slug });
  }

  async findOne(filter) {
    return await Tenant.findOne(filter);
  }

  async update(id, updateData, options = {}) {
    return await Tenant.findByIdAndUpdate(id, updateData, { new: true, ...options });
  }
}

export default new TenantRepository();