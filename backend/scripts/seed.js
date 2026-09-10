import mongoose from 'mongoose';
import { connectDB } from '../src/config/database.js';
import { seedPlans } from '../src/seeders/plan.seeder.js';
import { env } from '../src/config/env.js';

const runScript = async () => {
  console.log('🚀 [CLI Script Initiated]: Bắt đầu tiến trình Seeding dữ liệu hệ thống...');

  try {
    // 1. Kết nối cơ sở dữ liệu
    await connectDB();

    // 2. Phân tích cờ tham số từ Terminal
    const args = process.argv.slice(2);
    const hasOverwriteFlag = args.includes('--overwrite');
    const isForceAllowed = args.includes('--force');

    // 3. Hàng rào bảo vệ: chỉ chặn nếu ghi đè mà không có cờ xác nhận --force
    if (env.nodeEnv === 'production' && hasOverwriteFlag && !isForceAllowed) {
      console.warn('⚠️ [PRODUCTION WARNING]: Bạn đang yêu cầu ghi đè Plan trên môi trường PRODUCTION.');
      console.warn('Nếu bạn chắc chắn muốn khởi tạo lại, hãy thêm cờ: npm run seed -- --overwrite --force');
      await mongoose.connection.close();
      process.exit(1);
    }

    // 4. Kích hoạt Seeder
    await seedPlans(hasOverwriteFlag);

    console.log('🏁 [CLI Script Success]: Tiến trình Seeding đã kết thúc an toàn.');
  } catch (error) {
    console.error('💥 [CLI Script Crash]: Phát hiện lỗi nghiêm trọng khiến tiến trình đổ vỡ:', error.message);
    process.exit(1);
  } finally {
    // 5. Đảm bảo đóng kết nối dù thành công hay thất bại
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('🔌 [Database Network]: Đã ngắt kết nối an toàn với MongoDB. Exit code: 0.');
    }
    process.exit(0);
  }
};

// Thực thi script
runScript();