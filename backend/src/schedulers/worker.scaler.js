import { emailQueue } from '../queues/email.queue.js';
import adaptiveScheduler from './adaptive.scheduler.js';

class WorkerScaler {
  constructor() {
    this.workerInstance = null;
    this.scalingInterval = null;
    this.minConcurrency = 2;
    this.maxConcurrency = 20;
    this.currentConcurrency = 2;
  }

  init(workerInstance, { minConcurrency = 2, maxConcurrency = 20, checkIntervalMs = 3000 } = {}) {
    this.workerInstance = workerInstance;
    this.minConcurrency = minConcurrency;
    this.maxConcurrency = maxConcurrency;
    this.currentConcurrency = workerInstance.opts?.concurrency || minConcurrency;

    console.log(
      `🧠 [VERDIO Auto-scaler]: Khởi tạo bộ tự động co giãn luồng (Min: ${minConcurrency}, Max: ${maxConcurrency}, Chu kỳ: ${checkIntervalMs}ms)`
    );

    this.startScalingLoop(checkIntervalMs);
  }

  startScalingLoop(intervalMs) {
    this.scalingInterval = setInterval(async () => {
      try {
        if (!this.workerInstance) return;

        // Lấy số lượng job theo từng trạng thái trong Redis
        const counts = await emailQueue.getJobCounts('waiting', 'prioritized', 'active');
        const totalBacklog = (counts.waiting || 0) + (counts.prioritized || 0);
        const activeCount = counts.active || 0;

        const optimalConcurrency = adaptiveScheduler.calculateOptimalConcurrency(
          totalBacklog,
          this.minConcurrency,
          this.maxConcurrency
        );

        if (optimalConcurrency !== this.currentConcurrency) {
          console.log(
            `⚡ [Auto-scaler Trigger]: Hàng đợi tồn đọng: ${totalBacklog} (Chờ: ${counts.waiting}, Ưu tiên: ${counts.prioritized}) | Đang chạy: ${activeCount}. Điều chỉnh Concurrency: ${this.currentConcurrency} -> ${optimalConcurrency}`
          );

          // Cập nhật động số luồng của BullMQ Worker
          this.workerInstance.concurrency = optimalConcurrency;
          this.currentConcurrency = optimalConcurrency;
        }
      } catch (err) {
        console.error('❌ [Auto-scaler Error]:', err.message);
      }
    }, intervalMs);
  }

  getMetrics() {
    return {
      currentConcurrency: this.currentConcurrency,
      minConcurrency: this.minConcurrency,
      maxConcurrency: this.maxConcurrency
    };
  }

  stop() {
    if (this.scalingInterval) {
      clearInterval(this.scalingInterval);
      console.log('🛑 [Auto-scaler]: Đã dừng vòng lặp điều phối.');
    }
  }
}

export default new WorkerScaler();