import { emailQueue } from '../queues/email.queue.js'; // Thay đúng đường dẫn tới emailQueue của bạn

export function startPriorityAgingScanner(intervalMs = 2000) {
  console.log('🚀 [VERDIO Aging Scanner] Đã kích hoạt tiến trình làm già hóa Priority ngầm...');

  setInterval(async () => {
    try {
      // 1. Truy xuất tối đa 100 job ở trạng thái WAITING trong Redis ZSET
      const waitingJobs = await emailQueue.getJobs(['waiting'], 0, 100);
      const now = Date.now();

      for (const job of waitingJobs) {
        // Giữ nguyên làn ưu tiên tuyệt đối cho thư OTP (Priority = 1)
        if (job.data.type === 'OTP') continue;

        const createdAt = job.data.createdAt || job.timestamp;
        const waitTimeSec = (now - createdAt) / 1000;
        const currentPriority = job.opts.priority || 10;

        // Cứ mỗi 10 giây nằm chờ, giảm chỉ số priority đi 1 (tăng độ ưu tiên)
        const priorityReduction = Math.floor(waitTimeSec / 10);
        
        // Khống chế P_min = 2 (Không bao giờ cướp P = 1 của OTP)
        const newPriority = Math.max(2, currentPriority - priorityReduction);

        if (newPriority !== currentPriority) {
          // Cập nhật chỉ số Priority mới trực tiếp trong Redis
          await job.changePriority({ priority: newPriority });
          console.log(`⚡ [Aging] Job ${job.id} (${job.data.to}) chập nhật Priority: ${currentPriority} -> ${newPriority} (Đã chờ ${Math.floor(waitTimeSec)}s)`);
        }
      }
    } catch (error) {
      // Bắt lỗi an toàn, không làm ngắt Server chính
      console.error('Lỗi trong Aging Scanner:', error.message);
    }
  }, intervalMs);
}