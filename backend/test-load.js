import { emailQueue } from './src/queues/email.queue.js';
import adaptiveScheduler from './src/schedulers/adaptive.scheduler.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runSpikeLoadTest() {
  console.log('\n🚀 [TEST LOAD]: Bắt đầu kịch bản kiểm thử tải đột biến (Spike Load)...');

  // 1. Dọn dẹp các job cũ còn sót
  await emailQueue.drain();
  console.log('🧹 [TEST LOAD]: Đã làm sạch hàng đợi.');

  // 2. Tạo đồng thời 120 jobs (Mô phỏng 100 bulk campaign + 20 OTP khẩn cấp)
  const totalJobs = 120;
  const jobs = [];

  console.log(`📦 [TEST LOAD]: Đang tạo đồng loạt ${totalJobs} jobs vào hàng đợi...`);

  for (let i = 1; i <= totalJobs; i++) {
    const isOtp = i % 6 === 0; // Cứ mỗi 6 jobs thì có 1 job OTP khẩn cấp

    const priority = adaptiveScheduler.calculatePriority({
      slaSeconds: isOtp ? 5 : 60,
      planCode: isOtp ? 'ENTERPRISE' : 'FREE',
      isUrgent: isOtp
    });

    jobs.push({
      name: isOtp ? `job-otp-${i}` : `job-bulk-${i}`,
      data: {
        to: `test.recipient.${i}@example.com`,
        subject: isOtp ? '🚨 [OTP] Mã xác thực bảo mật' : '📢 [Promo] Ưu đãi đặc biệt',
        html: `<h1>Nội dung test email ${i}</h1>`,
        isMock: true,
        enqueuedAt: Date.now()
      },
      opts: {
        priority: priority
      }
    });
  }

  // 3. Đẩy toàn bộ vào BullMQ
  await emailQueue.addBulk(jobs);
  console.log(`✅ [TEST LOAD]: Đã nạp thành công ${totalJobs} jobs vào hàng đợi Redis!`);
  console.log('👀 Hãy quan sát Terminal đang chạy Server để xem Auto-scaler kích hoạt co giãn luồng.\n');

  // 4. Theo dõi tiến trình
  for (let s = 1; s <= 10; s++) {
    await sleep(1500);
    const counts = await emailQueue.getJobCounts('waiting', 'prioritized', 'active', 'completed');
    const backlog = (counts.waiting || 0) + (counts.prioritized || 0);

    console.log(`📊 [Monitor t=${s * 1.5}s]: Tồn đọng: ${backlog} (Ưu tiên: ${counts.prioritized}) | Đang xử lý: ${counts.active} | Đã xong: ${counts.completed}`);
    
    if (backlog === 0 && counts.active === 0) {
      console.log('\n🎉 [TEST LOAD]: Tất cả jobs đã được xử lý hoàn tất!');
      break;
    }
  }

  process.exit(0);
}

runSpikeLoadTest().catch((err) => {
  console.error('❌ Lỗi chạy test tải:', err.message);
  process.exit(1);
});