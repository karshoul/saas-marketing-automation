import contactRepository from '../repositories/contact.repository.js';
import ApiError from '../utils/apiError.util.js';

class ContactService {
  async createContact(tenantId, data) {
    const existing = await contactRepository.findByEmail(data.email, tenantId);
    if (existing) {
      throw new ApiError(409, 'Email này đã tồn tại trong danh bạ Workspace của bạn.');
    }

    return await contactRepository.create({
      ...data,
      tenantId
    });
  }

  async getContacts(tenantId, query) {
    const { page = 1, limit = 10, status, tag, search } = query;
    const filter = { tenantId };

    if (status) filter.status = status;
    if (tag) filter.tags = tag;
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    return await contactRepository.findAll(filter, { page, limit });
  }

  async getContactById(id, tenantId) {
    const contact = await contactRepository.findById(id, tenantId);
    if (!contact) {
      throw new ApiError(404, 'Không tìm thấy thông tin khách hàng.');
    }
    return contact;
  }

  async updateContact(id, tenantId, updateData) {
    const contact = await contactRepository.updateById(id, tenantId, updateData);
    if (!contact) {
      throw new ApiError(404, 'Không tìm thấy thông tin khách hàng cần cập nhật.');
    }
    return contact;
  }

  async deleteContact(id, tenantId) {
    const contact = await contactRepository.deleteById(id, tenantId);
    if (!contact) {
      throw new ApiError(404, 'Không tìm thấy thông tin khách hàng cần xóa.');
    }
    return true;
  }

  async importContacts(tenantId, contactsList) {
    if (!Array.isArray(contactsList) || contactsList.length === 0) {
      throw new ApiError(400, 'Danh sách liên hệ import không hợp lệ.');
    }

    const result = await contactRepository.bulkUpsert(contactsList, tenantId);
    return {
      upsertedCount: result.upsertedCount || 0,
      modifiedCount: result.modifiedCount || 0,
      matchedCount: result.matchedCount || 0
    };
  }
}

export default new ContactService();