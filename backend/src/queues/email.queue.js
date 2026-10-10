import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import Campaign from '../models/Campaign.js';
import Tenant from '../models/Tenant.js';
import mailService from '../services/mail.service.js';

export const EMAIL_QUEUE_NAME = 'verdio-email-queue';

// Khởi tạo hàng đợi kết nối với cụm Redis
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

export const initEmailWorker = (concurrency = 2) => {
  const worker = new Worker(
    EMAIL_QUEUE_NAME,
    async (job) => {
      const { to, subject, html, fromName, campaignId, recipientId, tenantId, isMock, createdAt, slaSeconds } = job.data;

      const startTime = Date.now();
      const waitingTimeMs = startTime - (createdAt ? new Date(createdAt).getTime() : startTime);
      const isSlaViolated = slaSeconds ? (waitingTimeMs / 1000) > slaSeconds : false;

      let sendResult;

      // Gửi email thực tế qua Resend HTTP REST API
      if (mailService && typeof mailService.send === 'function' && !isMock) {
        sendResult = await mailService.send({ to, subject, html, fromName, campaignId, recipientId, tenantId });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 120));
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
      concurrency,
      limiter: {
        max: 50,
        duration: 1000
      }
    }
  );

  worker.on('completed', async (job, result) => {
    console.log(`✉️ [Worker Job Done]: ${job.data.to} (ID: ${job.id}, Chờ: ${result.waitingTimeMs}ms)`);

    try {
      const { tenantId, campaignId } = job.data;

      // 1. Tăng bộ đếm Quota nguyên tử cho Tenant
      if (tenantId) {
        await Tenant.findByIdAndUpdate(tenantId, {
          $inc: { 'usage.emailsSentThisMonth': 1 }
        });
      }

      // 2. Cập nhật tiến độ Chiến dịch
      if (campaignId) {
        const campaign = await Campaign.findByIdAndUpdate(
          campaignId,
          { $inc: { 'stats.sentCount': 1 } },
          { new: true }
        );

        // 🛠️ SỬA Ở ĐÂY: Dùng điều kiện >= hoặc kiểm tra trạng thái thực tế
        if (campaign && (campaign.stats.sentCount >= campaign.stats.totalRecipients || campaign.status === 'PROCESSING')) {
          // Kiểm tra nếu số lượng gửi thực tế đã gần bằng tổng số (sai số tối đa 1-2 mail do contact lỗi)
          const totalExpected = campaign.stats.totalRecipients || 1;
          if (campaign.stats.sentCount >= totalExpected) {
            campaign.status = 'COMPLETED';
            campaign.sentAt = new Date();
            await campaign.save();
            console.log(`🎉 [Campaign Finished]: Chiến dịch "${campaign.name}" đã hoàn tất 100%!`);
          }
        }
      }
    } catch (err) {
      console.error('❌ Lỗi cập nhật số liệu:', err.message);
    }
  });

  worker.on('failed', async (job, err) => {
    console.error(`❌ [Job ${job?.id} Failed]: ${err.message}`);
    try {
      if (job?.data?.campaignId) {
        await Campaign.findByIdAndUpdate(job.data.campaignId, {
          $inc: { 'stats.failedCount': 1 }
        });
      }
    } catch (dbErr) {
      console.error('❌ Lỗi cập nhật thất bại:', dbErr.message);
    }
  });

  return worker;
};