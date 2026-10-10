import Contact from '../models/Contact.js';

class ContactRepository {
  async create(contactData, options = {}) {
    if (Array.isArray(contactData)) {
      return await Contact.create(contactData, options);
    }
    const contact = new Contact(contactData);
    return await contact.save(options);
  }

  async findById(id, tenantId) {
    return await Contact.findOne({ _id: id, tenantId });
  }

  async findByEmail(email, tenantId) {
    return await Contact.findOne({ email: email.toLowerCase(), tenantId });
  }

  async findAll(filter = {}, { page = 1, limit = 10, sort = { createdAt: -1 } } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [data, total] = await Promise.all([
    Contact.find(filter).sort(sort).skip(skip).limit(limitNum),
    Contact.countDocuments(filter)
  ]);

  return {
    data,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
}

  async updateById(id, tenantId, updateData, options = {}) {
    return await Contact.findOneAndUpdate(
      { _id: id, tenantId },
      updateData,
      { new: true, runValidators: true, ...options }
    );
  }

  async deleteById(id, tenantId) {
    return await Contact.findOneAndDelete({ _id: id, tenantId });
  }

  async countByTenant(tenantId) {
    return await Contact.countDocuments({ tenantId });
  }

  async bulkUpsert(contacts, tenantId) {
  if (!contacts || contacts.length === 0) return { insertedCount: 0, matchedCount: 0 };

  // Lọc chỉ lấy các contact có email hợp lệ
  const validContacts = contacts.filter(item => item && item.email);

  const bulkOps = validContacts.map((item) => ({
    updateOne: {
      filter: { email: item.email.trim().toLowerCase(), tenantId },
      update: {
        $set: {
          firstName: item.firstName || '',
          lastName: item.lastName || '',
          phone: item.phone || '',
          company: item.company || '',
          title: item.title || '',
          country: item.country || 'Vietnam',
          segment: item.segment || 'LEADS',
          status: item.status || 'SUBSCRIBED'
        },
        $addToSet: {
          tags: { $each: item.tags || [] }
        }
      },
      upsert: true
    }
  }));

  if (bulkOps.length === 0) return { insertedCount: 0, matchedCount: 0 };
  return await Contact.bulkWrite(bulkOps);
}
}

export default new ContactRepository();