import Automation from '../models/Automation.js';

class AutomationRepository {
  async create(data) {
    return await Automation.create(data);
  }

  async findById(id, tenantId) {
    return await Automation.findOne({ _id: id, tenantId }).populate('steps.config.templateId');
  }

  async findAll(filter = {}, { page = 1, limit = 10, sort = { createdAt: -1 } } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      Automation.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('steps.config.templateId', 'name subject'),
      Automation.countDocuments(filter)
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
    return await Automation.findOneAndUpdate(
      { _id: id, tenantId },
      updateData,
      { new: true, runValidators: true }
    );
  }

  async deleteById(id, tenantId) {
    return await Automation.findOneAndDelete({ _id: id, tenantId });
  }

  async findActiveByTrigger(tenantId, triggerType) {
    return await Automation.find({
      tenantId,
      status: 'ACTIVE',
      'trigger.type': triggerType
    }).populate('steps.config.templateId');
  }
}

export default new AutomationRepository();