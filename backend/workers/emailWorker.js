import { Worker } from 'bullmq';
import axios from 'axios';
import redisConnection from '../config/redis.js';
import Campaign from '../models/Campaign.js';
import dotenv from 'dotenv';

dotenv.config();
console.log("🔑 Kiểm tra Resend Key hiện tại đang nạp:", process.env.RESEND_API_KEY);

// Khởi tạo bộ xử lý ngầm gắn với 'email-queue'
const emailWorker = new Worker('email-queue', async (job) => {
  const { campaignId, contactEmail, contactName, subject, htmlContent } = job.data;
  
  console.log(`⏳ Worker đang xử lý gửi mail cho: ${contactEmail}`);

  try {
    // Gọi API của Resend để gửi mail thật đi
    // Lưu ý: Tài khoản Resend miễn phí mặc định chỉ được gửi tới chính Email bạn đăng ký tài khoản Resend (Môi trường Sandbox)
    await axios.post('https://api.resend.com/emails', {
      from: 'SaaS Marketing <onboarding@resend.dev>',
      to: [contactEmail],
      subject: subject,
      html: htmlContent.replace('${name}', contactName) // Thay thế thẻ tên động nếu có
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Sau khi gửi thành công 1 mail, dùng $inc để tăngdeliveredCount trong MongoDB lên +1 thời gian thực
    await Campaign.findByIdAndUpdate(campaignId, {
      $inc: { 'metrics.deliveredCount': 1 }
    });

    console.log(`✅ Đã gửi thành công email tới: ${contactEmail}`);

  } catch (error) {
    console.error(`❌ Gửi mail thất bại cho ${contactEmail}:`, error.response?.data || error.message);
    throw error; // Ném lỗi để BullMQ biết và tự động đưa vào trạng thái 'failed' để quản lý
  }
}, {
  connection: redisConnection
});

console.log('👷 Bộ xử lý ngầm Worker [emailWorker] đã được kích hoạt và đang lắng nghe Redis...');

export default emailWorker;