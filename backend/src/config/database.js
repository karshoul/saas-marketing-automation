import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  const options = {
    autoIndex: env.nodeEnv === 'development', // Chỉ tự động build index ở dev, production phải build thủ công/background để tránh nghẽn tải
    maxPoolSize: 50, // Cấu hình Connection Pool cho Enterprise SaaS gánh nhiều query song song
    minPoolSize: 10,
    socketTimeoutMS: 45000, // Đóng socket sau 45s nếu không có phản hồi
    serverSelectionTimeoutMS: 5000, // Chờ tối đa 5s để tìm thấy Node Database khỏe nhất
  };

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.mongoUri, options);
    console.log('🔗 [MongoDB Connection]: Kết nối cơ sở dữ liệu MongoDB thành công!');
  } catch (error) {
    console.error('❌ [MongoDB Connection Error]: Thất bại khi kết nối ban đầu:', error.message);
    process.exit(1); // Chặn đứng boot app nếu database die ngay từ đầu
  }
};

// LẮNG NGHE CÁC SỰ KIỆN VÒNG ĐỜI KẾT NỐI (CONNECTION LIFECYCLE EVENTS)
mongoose.connection.on('error', (err) => {
  console.error(`❌ [MongoDB Runtime Error]: Lỗi phát sinh trong quá trình chạy: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ [MongoDB Warning]: Mất kết nối với MongoDB! ');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 [MongoDB Info]: Tái kết nối với MongoDB thành công!');
});

// GRACEFUL SHUTDOWN: Đóng kết nối an toàn khi tắt Server (e.g., Ctrl+C hoặc Deploy lại)
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🛑 [MongoDB Event]: Ứng dụng dừng đột ngột. Đã đóng hồ bơi kết nối (Connection Pool) MongoDB an toàn.');
  process.exit(0);
});