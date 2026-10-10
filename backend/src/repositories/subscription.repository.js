import Subscription from '../models/Subscription.js';

class SubscriptionRepository {
  /**
   * Tạo Subscription mới hỗ trợ cả Plain Object lẫn Array, tương thích hoàn toàn ACID Session
   */
  async create(subscriptionData, options = {}) {
    // 1. Nếu truyền vào mảng nhiều phần tử
    if (Array.isArray(subscriptionData)) {
      // Bóc tách session nếu có để truyền chuẩn cú pháp Mongoose create(docs, options)
      return await Subscription.create(subscriptionData, options);
    }

    // 2. Nếu truyền Object đơn lẻ (Khuyên dùng): Dùng new Model() + .save(options) để giữ toàn vẹn Session
    const subscriptionDoc = new Subscription(subscriptionData);
    return await subscriptionDoc.save(options);
  }

  async findById(id) {
    return await Subscription.findById(id);
  }

  async findByTenantId(tenantId) {
    return await Subscription.findOne({ tenantId });
  }

  async findOne(filter) {
    return await Subscription.findOne(filter);
  }

  async update(id, updateData, options = {}) {
    return await Subscription.findByIdAndUpdate(id, updateData, { new: true, ...options });
  }
}

export default new SubscriptionRepository();