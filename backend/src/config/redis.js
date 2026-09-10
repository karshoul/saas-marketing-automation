import Redis from 'ioredis';
import { env } from './env.js';

// Ưu tiên đọc REDIS_URL từ biến môi trường (Render/Upstash)
const redisUrl = process.env.REDIS_URL || env.redis?.url;

export const redisConfig = redisUrl
  ? {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: {
        rejectUnauthorized: false
      },
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        console.warn(`🔄 [Redis Reconnect Attempt]: Đang thử kết nối lại lần thứ ${times} sau ${delay}ms...`);
        return delay;
      }
    }
  : {
      host: env.redis.host,
      port: env.redis.port,
      password: env.redis.password || undefined,
      maxRetriesPerRequest: null,
      // Bật TLS nếu host là Upstash hoặc môi trường production
      tls: env.redis.host?.includes('upstash.io') ? { rejectUnauthorized: false } : undefined,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        console.warn(`🔄 [Redis Reconnect Attempt]: Đang thử kết nối lại lần thứ ${times} sau ${delay}ms...`);
        return delay;
      }
    };

// Khởi tạo Redis instance
const redis = redisUrl ? new Redis(redisUrl, redisConfig) : new Redis(redisConfig);

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