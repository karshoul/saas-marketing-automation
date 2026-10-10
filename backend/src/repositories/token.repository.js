import Token from '../models/Token.js';

class TokenRepository {
  async create(tokenData, options = {}) {
    if (Array.isArray(tokenData)) {
      return await Token.create(tokenData, options);
    }
    const tokenDoc = new Token(tokenData);
    return await tokenDoc.save(options);
  }

  async findOne(filter) {
    return await Token.findOne(filter);
  }

  async findByTokenHash(tokenHash, type) {
    return await Token.findOne({ tokenHash, type });
  }

  async delete(id, options = {}) {
    return await Token.findByIdAndDelete(id, options);
  }

  async deleteById(id, options = {}) {
    return await Token.findByIdAndDelete(id, options);
  }

  async deleteMany(filter, options = {}) {
    return await Token.deleteMany(filter, options);
  }
}

export default new TokenRepository();