import Token from '../models/Token.js';

class TokenRepository {
  async create(tokenData, options = {}) {
    return await Token.create(tokenData, options);
  }

  async findOne(filter) {
    return await Token.findOne(filter);
  }

  async delete(id, options = {}) {
    return await Token.findByIdAndDelete(id, options);
  }

  async deleteMany(filter, options = {}) {
    return await Token.deleteMany(filter, options);
  }
}

export default new TokenRepository();