import { emailQueue } from '../queues/email.queue.js';
import adaptiveScheduler from './adaptive.scheduler.js';

class WorkerScaler {
  constructor() {
    this.workerInstance = null;
    this.scalingTimeout = null;
    this.minConcurrency = 2;
    this.maxConcurrency = 20;
    this.currentConcurrency = 2;

    // Cấu hình chu kỳ thích ứng (Adaptive Interval)
    this.activeIntervalMs = 3000;   // Khi ĐANG CÓ TẢI: quét gắt gao 3s/lần để scale nhanh
    this.idleIntervalMs = 30000;    // Khi HÀNG ĐỢI RỖNG (IDLE): dãn ra 30s/lần để cứu quota Redis
    this.isIdle = true;
  }

  init(workerInstance, { minConcurrency = 2, maxConcurrency = 20 } = {}) {
    this.workerInstance = workerInstance;
    this.minConcurrency = minConcurrency;
    this.maxConcurrency = maxConcurrency;
    this.currentConcurrency = workerInstance?.opts?.concurrency || minConcurrency;

    console.log(
      `🧠 [VERDIO Elastic Auto-scaler]: Kích hoạt bộ co giãn luồng thích ứng (Min: ${minConcurrency}, Max: ${maxConcurrency})`
    );

    this.runAdaptiveLoop();
  }

  async runAdaptiveLoop() {
    try {
      if (!this.workerInstance) return;

      // 1. Quét số lượng job trong Redis
      const counts = await emailQueue.getJobCounts('waiting', 'prioritized', 'active');
      const totalBacklog = (counts.waiting || 0) + (counts.prioritized || 0);
      const activeCount = counts.active || 0;

      // 2. Thuật toán co giãn luồng tự động (Elastic Scaling Logic)
      if (totalBacklog > 0 || activeCount > 0) {
        // Có việc làm -> Chuyển trạng thái ACTIVE
        this.isIdle = false;

        const optimalConcurrency = adaptiveScheduler.calculateOptimalConcurrency(
          totalBacklog,
          this.minConcurrency,
          this.maxConcurrency
        );

        if (optimalConcurrency !== this.currentConcurrency) {
          console.log(
            `⚡ [Elastic Trigger - TẢI TĂNG]: Tồn đọng: ${totalBacklog} | Đang chạy: ${activeCount} -> Co giãn luồng: ${this.currentConcurrency} ➔ ${optimalConcurrency}`
          );
          this.workerInstance.concurrency = optimalConcurrency;
          this.currentConcurrency = optimalConcurrency;
        }
      } else {
        // Hàng đợi rỗng -> Trả về mức min và chuyển sang chế độ IDLE
        if (!this.isIdle) {
          console.log(`🍃 [Elastic Trigger - HẾT TẢI]: Hàng đợi đã sạch -> Hạ luồng về Min (${this.minConcurrency}) & Chuyển sang chế độ tiết kiệm Redis.`);
          this.isIdle = true;
          this.workerInstance.concurrency = this.minConcurrency;
          this.currentConcurrency = this.minConcurrency;
        }
      }
    } catch (err) {
      console.error('❌ [Auto-scaler Error]:', err.message);
    } finally {
      // 3. Chu kỳ linh hoạt: Đang có việc thì 3s check lại; Khi rảnh rỗi thì 30s mới check
      const nextDelay = this.isIdle ? this.idleIntervalMs : this.activeIntervalMs;
      this.scalingTimeout = setTimeout(() => this.runAdaptiveLoop(), nextDelay);
    }
  }

  /**
   * Đánh thức Auto-scaler NGAY LẬP TỨC (Dùng khi user vừa bấm "Gửi Chiến Dịch" từ API)
   */
  wakeUp() {
    if (this.isIdle) {
      console.log('⚡ [Auto-scaler WakeUp]: Phát hiện sự kiện phát tán mới, đánh thức bộ co giãn luồng tức thì!');
      this.isIdle = false;
      if (this.scalingTimeout) clearTimeout(this.scalingTimeout);
      this.runAdaptiveLoop();
    }
  }

  getMetrics() {
    return {
      currentConcurrency: this.currentConcurrency,
      minConcurrency: this.minConcurrency,
      maxConcurrency: this.maxConcurrency,
      status: this.isIdle ? 'IDLE (Tiết kiệm Redis)' : 'ACTIVE (Đang co giãn)'
    };
  }

  stop() {
    if (this.scalingTimeout) {
      clearTimeout(this.scalingTimeout);
      console.log('🛑 [Auto-scaler]: Đã dừng chu kỳ giám sát luồng.');
    }
  }
}

export default new WorkerScaler();