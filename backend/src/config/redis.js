import Redis from 'ioredis';
import { env } from './env.js';

const redisConfig = {
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password,
  maxRetriesPerRequest: null, // Bắt buộc phải là null để BullMQ hoạt động đúng quy chuẩn kỹ thuật
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000); // Tăng dần thời gian chờ giữa các lần reconnect, tối đa 3s
    console.warn(`🔄 [Redis Reconnect Attempt]: Đang thử kết nối lại lần thứ ${times} sau ${delay}ms...`);
    return delay;
  },
};

// Khởi tạo Singleton Instance cho Redis Client
const redis = new Redis(redisConfig);

// LẮNG NGHE SỰ KIỆN TRẠNG THÁI HẠ TẦNG REDIS
redis.on('connect', () => {
  console.log('⚡ [Redis Connection]: Thiết lập đường truyền đến cụm Redis thành công!');
});

redis.on('error', (err) => {
  console.error(`❌ [Redis Runtime Error]: Phát hiện lỗi hệ thống mạng lưới Redis: ${err.message}`);
});

redis.on('end', () => {
  console.warn('⚠️ [Redis Event]: Chu kỳ kết nối Redis đã chính thức kết thúc hoàn toàn.');
});

export default redis;