import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình các thông số kết nối lấy từ file .env
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null // Bắt buộc phải có thuộc tính này thì BullMQ mới chạy ổn định
};

// Khởi tạo một thực thể kết nối Redis
const redisConnection = new IORedis(redisConfig);

redisConnection.on('connect', () => {
  console.log('📡 Node.js đã kết nối thông suốt tới Redis Server (Port 6379)!');
});

redisConnection.on('error', (err) => {
  console.error('❌ Lỗi kết nối Redis:', err.message);
});

export default redisConnection;