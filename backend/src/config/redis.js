import Redis from 'ioredis';
import { env } from './env.js';

// Cấu hình kết nối tối ưu cho Upstash Redis & BullMQ
export const redisConfig = {
  host: (process.env.REDIS_HOST || env.redis.host || '').replace(/["']/g, '').trim(),
  port: Number(process.env.REDIS_PORT || env.redis.port) || 6379,
  password: (process.env.REDIS_PASSWORD || env.redis.password || '').replace(/["']/g, '').trim(),
  // Bắt buộc bật TLS khi kết nối Upstash
  tls: {
    rejectUnauthorized: false
  },
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  keepAlive: 10000, // Duy trì kết nối socket tránh Upstash tự ngắt
  retryStrategy(times) {
    if (times > 20) {
      console.error('❌ [Redis Error]: Không thể kết nối lại sau 20 lần thử.');
      return null;
    }
    return Math.min(times * 200, 3000);
  }
};

// Khởi tạo Redis instance chính
const redis = new Redis(redisConfig);

redis.on('connect', () => {
  console.log('⚡ [Redis Connection]: Thiết lập đường truyền đến cụm Redis thành công!');
});

redis.on('error', (err) => {
  // Bỏ qua lỗi ngắt kết nối tạm thời từ Upstash serverless
  if (err.message.includes('ECONNRESET')) return;
  console.error(`❌ [Redis Runtime Error]: ${err.message}`);
});

export { redis };
export default redis;