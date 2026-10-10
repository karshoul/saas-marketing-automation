import Template from '../models/Template.js';

class TemplateRepository {
  async create(templateData) {
    return await Template.create(templateData);
  }

  async findById(id, tenantId) {
    return await Template.findOne({ _id: id, tenantId });
  }

  async findAll(filter = {}, { page = 1, limit = 12, sort = { updatedAt: -1 } } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      Template.find(filter).sort(sort).skip(skip).limit(limitNum),
      Template.countDocuments(filter)
    ]);

    return {
      data,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    };
  }

  async updateById(id, tenantId, updateData) {
    return await Template.findOneAndUpdate(
      { _id: id, tenantId },
      updateData,
      { new: true, runValidators: true }
    );
  }

  async deleteById(id, tenantId) {
    return await Template.findOneAndDelete({ _id: id, tenantId });
  }
}

export default new TemplateRepository();