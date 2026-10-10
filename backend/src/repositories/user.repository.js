import User from '../models/User.js';

class UserRepository {
  async create(userData, options = {}) {
    // 🔥 Sửa lại để tương thích hoàn toàn với ACID Transaction Session
    if (Array.isArray(userData)) {
      return await User.create(userData, options);
    }
    const userDoc = new User(userData);
    return await userDoc.save(options);
  }

  async findByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() });
  }

  async findById(id) {
    return await User.findById(id);
  }

  async findOne(filter) {
    return await User.findOne(filter);
  }

  async update(id, updateData, options = {}) {
    return await User.findByIdAndUpdate(id, updateData, { new: true, ...options });
  }
}

export default new UserRepository();