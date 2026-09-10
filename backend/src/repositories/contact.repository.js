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
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Contact.find(filter).sort(sort).skip(skip).limit(limit),
      Contact.countDocuments(filter)
    ]);

    return {
      data,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
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

    const bulkOps = contacts.map((item) => ({
      updateOne: {
        filter: { email: item.email.toLowerCase(), tenantId },
        update: {
          $set: {
            firstName: item.firstName || '',
            lastName: item.lastName || '',
            phone: item.phone || '',
            status: item.status || 'SUBSCRIBED'
          },
          $addToSet: {
            tags: { $each: item.tags || [] }
          }
        },
        upsert: true
      }
    }));

    return await Contact.bulkWrite(bulkOps);
  }
}

export default new ContactRepository();