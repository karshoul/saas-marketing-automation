import express from 'express';
import Campaign from '../models/Campaign.js';

const router = express.Router();

// API WEBHOOK ĐÓN TÍN HIỆU TỪ RESEND
// POST: http://localhost:5000/api/webhooks/resend
router.post('/resend', async (req, res) => {
  try {
    const eventData = req.body;
    
    console.log(`📥 Nhận được Webhook từ Resend. Loại sự kiện: ${eventData.type}`);

    // Kiểm tra nếu sự kiện là người dùng click vào link trong email
    if (eventData.type === 'email.clicked') {
      // Resend luôn trả về các thông tin đính kèm trong gói tin
      // Chúng ta sẽ bóc tách để lấy trích xuất thông tin chiến dịch tùy biến sau này
      // Hiện tại ta sẽ giả lập tăng clickCount cho chiến dịch đang chạy gần nhất dựa trên dữ liệu test
      
      console.log('🔥 Người dùng đã click vào link! Tiến hành tăng chỉ số clickCount...');
      
      // Tìm chiến dịch đang ở trạng thái 'Sending' để cập nhật nhảy số
      await Campaign.findOneAndUpdate(
        { status: 'Sending' },
        { $inc: { 'metrics.clickCount': 1 } }
      );
    }

    // Luôn luôn trả về trạng thái 200 OK để báo cho Resend biết Backend đã nhận được đồ, tránh họ gửi lại liên tục
    res.status(200).send('Webhook Received');

  } catch (error) {
    console.error('❌ Lỗi xử lý Webhook:', error.message);
    res.status(500).send('Webhook Error');
  }
});

export default router;