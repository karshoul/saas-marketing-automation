import Campaign from '../models/Campaign.js';

class CampaignRepository {
  async create(data, options = {}) {
    const campaign = new Campaign(data);
    return await campaign.save(options);
  }

  async findById(id, tenantId) {
    return await Campaign.findOne({ _id: id, tenantId });
  }

  async findAll(filter = {}, { page = 1, limit = 10, sort = { createdAt: -1 } } = {}) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Campaign.find(filter).sort(sort).skip(skip).limit(limit),
      Campaign.countDocuments(filter)
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
    return await Campaign.findOneAndUpdate(
      { _id: id, tenantId },
      updateData,
      { new: true, runValidators: true, ...options }
    );
  }

  async deleteById(id, tenantId) {
    return await Campaign.findOneAndDelete({ _id: id, tenantId });
  }
}

export default new CampaignRepository();