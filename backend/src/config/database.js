import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  const options = {
    dbName: 'verdio_saas', // 👈 BẮT BUỘC: Ép Mongoose luôn luôn vào verdio_saas, bất kể URI viết kiểu gì!
    autoIndex: env.nodeEnv === 'development',
    maxPoolSize: 50,
    minPoolSize: 10,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000,
  };

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.mongoUri, options);
    
    // In rõ tên database thực tế đang kết nối để kiểm chứng
    console.log(`🔗 [MongoDB Connection]: Kết nối thành công! Database thực tế: [${mongoose.connection.name}]`);
  } catch (error) {
    console.error('❌ [MongoDB Connection Error]: Thất bại khi kết nối ban đầu:', error.message);
    process.exit(1);
  }
};

// LẮNG NGHE CÁC SỰ KIỆN VÒNG ĐỜI KẾT NỐI
mongoose.connection.on('error', (err) => {
  console.error(`❌ [MongoDB Runtime Error]: Lỗi phát sinh trong quá trình chạy: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ [MongoDB Warning]: Mất kết nối với MongoDB!');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 [MongoDB Info]: Tái kết nối với MongoDB thành công!');
});

// GRACEFUL SHUTDOWN
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🛑 [MongoDB Event]: Đã đóng kết nối MongoDB an toàn.');
  process.exit(0);
});