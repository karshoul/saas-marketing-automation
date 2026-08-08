import Subscription from '../models/Subscription.js';

class SubscriptionRepository {
  async create(subscriptionData, options = {}) {
    return await Subscription.create(subscriptionData, options);
  }
}

export default new SubscriptionRepository();