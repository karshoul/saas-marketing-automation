import Plan from '../models/Plan.js';

class PlanRepository {
  async findByCode(code) {
    return await Plan.findOne({ code, isActive: true });
  }
}

export default new PlanRepository();