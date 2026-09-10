import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import Campaign from '../models/Campaign.js';
import mailService from '../services/mail.service.js';

// ========================================================
// 1. TÊN QUEUE THỐNG NHẤT TOÀN HỆ THỐNG
// ========================================================
export const EMAIL_QUEUE_NAME = 'verdio-email-queue';

// ========================================================
// 2. CÔNG THỨC CHẤM ĐIỂM ƯU TIÊN THÍCH ỨNG P(t) THEO YÊU CẦU CỦA CÔ
// P càng NHỎ -> Ưu tiên xử lý CÀNG CAO trong BullMQ (1 là cao nhất)
// ========================================================
export const calculateDynamicPriority = ({
  slaSeconds = 60,       // T_SLA: 5s (OTP), 15s (Transactional), 60s (Marketing)
  tier = 'FREE',         // W_tier: ENTERPRISE = 10, PRO = 5, FREE = 0
  waitingSeconds = 0     // T_waiting: Thời gian job đã nằm đợi trong hàng
}) => {
  // Trọng số Tier
  const tierWeights = {
    ENTERPRISE: 10,
    PRO: 5,
    FREE: 0
  };
  const W_tier = tierWeights[tier.toUpperCase()] ?? 0;

  // Hằng số chuẩn hóa k = 5, hệ số lão hóa alpha = 0.5
  const k = 5;
  const alpha = 0.5;

  const baseSlaScore = Math.floor(slaSeconds / k);
  const agingDeduction = Math.floor(alpha * waitingSeconds);

  // Tính P(t): Điểm gốc từ SLA, trừ bớt điểm theo Tier và thời gian chờ
  let P = baseSlaScore - W_tier - agingDeduction;

  // BullMQ quy ước priority >= 1
  return Math.max(1, P);
};

// ========================================================
// 3. KHỞI TẠO BULLMQ QUEUE
// ========================================================
export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: {
      count: 2000
    },
    removeOnFail: false
  }
});

// ========================================================
// 4. HÀM THỐNG KÊ QUEUE CHO DASHBOARD & QUEUE-MONITOR (REAL-TIME)
// ========================================================
export const getQueueMetrics = async () => {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
    emailQueue.getDelayedCount()
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    totalQueued: waiting + active + delayed,
    queueName: EMAIL_QUEUE_NAME
  };
};

// ========================================================
// 5. KHỞI TẠO WORKER VỚI CO GIÃN LUỒNG (CONCURRENCY)
// ========================================================
export const initEmailWorker = (concurrency = 5) => {
  const worker = new Worker(
    EMAIL_QUEUE_NAME,
    async (job) => {
      const { to, subject, html, campaignId, recipientId, tenantId, isMock, createdAt, slaSeconds } = job.data;
      
      const startTime = Date.now();
      const waitingTimeMs = startTime - (createdAt ? new Date(createdAt).getTime() : startTime);
      const isSlaViolated = slaSeconds ? (waitingTimeMs / 1000) > slaSeconds : false;

      let sendResult;

      // Nếu có mailService thì gửi qua SMTP, nếu không tự động mô phỏng delay
      if (mailService && typeof mailService.send === 'function' && !isMock) {
        sendResult = await mailService.send({ to, subject, html, campaignId, recipientId, tenantId });
      } else {
        // Mô phỏng network latency 150ms
        await new Promise((resolve) => setTimeout(resolve, 150));
        sendResult = { success: true, mock: true };
      }

      return {
        ...sendResult,
        to,
        campaignId,
        waitingTimeMs,
        isSlaViolated,
        finishedAt: new Date().toISOString()
      };
    },
    {
      connection: redis,
      concurrency, // Số luồng xử lý đồng thời C_target
      limiter: {
        max: 50,
        duration: 1000
      }
    }
  );

  // Hook khi Job gửi thành công
  worker.on('completed', async (job, result) => {
    console.log(`✉️ [Worker Job Done]: Gửi tới ${job.data.to} (ID: ${job.id}, Wait: ${result.waitingTimeMs}ms, SLA Violated: ${result.isSlaViolated})`);

    try {
      if (job.data.campaignId) {
        const campaign = await Campaign.findByIdAndUpdate(
          job.data.campaignId,
          { $inc: { 'stats.sentCount': 1 } },
          { new: true }
        );

        if (campaign && campaign.stats.sentCount >= campaign.stats.totalRecipients) {
          campaign.status = 'COMPLETED';
          campaign.sentAt = new Date();
          await campaign.save();
          console.log(`🎉 [Campaign Finished]: Chiến dịch ${campaign._id} đã hoàn tất 100%!`);
        }
      }
    } catch (err) {
      console.error('❌ Lỗi cập nhật stats chiến dịch:', err.message);
    }
  });

  // Hook khi Job thất bại
  worker.on('failed', async (job, err) => {
    console.error(`❌ [Job ${job?.id} Failed]: ${err.message} (Thử lần: ${job?.attemptsMade})`);

    try {
      if (job?.data?.campaignId) {
        await Campaign.findByIdAndUpdate(job.data.campaignId, {
          $inc: { 'stats.failedCount': 1 }
        });
      }
    } catch (dbErr) {
      console.error('❌ Lỗi cập nhật stats thất bại:', dbErr.message);
    }
  });

  return worker;
};