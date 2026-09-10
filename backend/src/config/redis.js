import Redis from 'ioredis';
import { env } from './env.js';

export const redisConfig = {
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password,
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    console.warn(`🔄 [Redis Reconnect Attempt]: Đang thử kết nối lại lần thứ ${times} sau ${delay}ms...`);
    return delay;
  },
};

const redis = new Redis(redisConfig);

redis.on('connect', () => {
  console.log('⚡ [Redis Connection]: Thiết lập đường truyền đến cụm Redis thành công!');
});

redis.on('error', (err) => {
  console.error(`❌ [Redis Runtime Error]: Phát hiện lỗi hệ thống mạng lưới Redis: ${err.message}`);
});

redis.on('end', () => {
  console.warn('⚠️ [Redis Event]: Chu kỳ kết nối Redis đã chính thức kết thúc hoàn toàn.');
});

export { redis };
export default redis;