import { Queue } from 'bullmq';
import redisConnection from './redis.js';

// Khởi tạo hàng đợi mang tên 'email-queue' và gắn nó với kết nối Redis ở bước 1
export const emailQueue = new Queue('email-queue', {
  connection: redisConnection
});

console.log('📦 Hàng đợi BullMQ [email-queue] đã sẵn sàng nhận tác vụ!');