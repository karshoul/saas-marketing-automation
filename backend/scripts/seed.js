import { connectDB } from '../src/config/database.js';
import mongoose from 'mongoose';
import { seedPlans } from '../src/seeders/plan.seeder.js';
import { env } from '../src/config/env.js';

const runScript = async () => {
  console.log('🚀 [CLI Script Initiated]: Bắt đầu tiến trình Seeding dữ liệu hệ thống...');
  
  // 1. Kết nối cơ sở dữ liệu
  await connectDB();

  // 2. Phân tích cờ tham số từ Terminal (Kiểm tra xem người dùng có truyền --overwrite không)
  const args = process.argv.slice(2);
  const hasOverwriteFlag = args.includes('--overwrite');

  // 3. Hàng rào bảo vệ môi trường Production nghiêm ngặt
  if (env.nodeEnv === 'production' && hasOverwriteFlag) {
    console.error('🛑 [CRITICAL SECURITY BLOCK]: Bạn đang yêu cầu ghi đè (Overwrite) danh mục Plan trực tiếp trên môi trường PRODUCTION live!');
    console.error('Thao tác này có thể làm thay đổi hạn mức sử dụng của các khách hàng đang trả phí thực tế.');
    console.log('Vui lòng liên hệ Tech Lead / DevOps để thực hiện can thiệp thủ công thông qua DB Admin Panel.');
    await mongoose.connection.close();
    process.exit(1);
  }

  try {
    // 4. Kích hoạt Seeder
    await seedPlans(hasOverwriteFlag);
    
    console.log('🏁 [CLI Script Success]: Tiến trình Seeding đã kết thúc an toàn.');
  } catch (error) {
    console.error('💥 [CLI Script Crash]: Phát hiện lỗi nghiêm trọng khiến tiến trình đổ vỡ:', error.message);
  } finally {
    // 5. Giải phóng hồ bơi kết nối, tắt tiến trình sạch sẽ
    await mongoose.connection.close();
    console.log('🔌 [Database Network]: Đã ngắt kết nối an toàn với MongoDB. Exit code: 0.');
    process.exit(0);
  }
};

// Thực thi script
runScript();