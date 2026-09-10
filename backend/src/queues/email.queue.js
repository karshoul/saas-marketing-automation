import { Queue, Worker } from 'bullmq';
import { redisConfig, redis } from '../config/redis.js';
import Campaign from '../models/Campaign.js';

export const EMAIL_QUEUE_NAME = 'marketing-email-queue';

// BullMQ tự khởi tạo kết nối riêng với redisConfig có hỗ trợ TLS
export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: {
      count: 1000
    },
    removeOnFail: false
  }
});

export const initEmailWorker = (concurrency = 5) => {
  const worker = new Worker(
    EMAIL_QUEUE_NAME,
    async (job) => {
      const { to, subject, html, campaignId } = job.data;

      // Giả lập thời gian gửi email ngầm (200ms)
      await new Promise((resolve) => setTimeout(resolve, 200));

      return {
        success: true,
        sentTo: to,
        campaignId,
        sentAt: new Date().toISOString()
      };
    },
    {
      connection: redisConfig, // Dùng redisConfig để worker có kết nối độc lập
      concurrency,
      limiter: {
        max: 50,
        duration: 1000
      }
    }
  );

  // Bật log khi job hoàn thành và cập nhật thống kê vào DB
  worker.on('completed', async (job) => {
    console.log(`✉️ [Worker Job Done]: Đã gửi thành công tới -> ${job.data.to} (ID: ${job.id})`);

    try {
      if (job.data.campaignId) {
        const campaign = await Campaign.findByIdAndUpdate(
          job.data.campaignId,
          { $inc: { 'stats.sentCount': 1 } },
          { new: true }
        );

        if (campaign && campaign.stats.sentCount >= campaign.stats.totalRecipients) {
          campaign.status = 'COMPLETED';
          await campaign.save();
          console.log(`🎉 [Campaign Finished]: Chiến dịch ${campaign._id} đã hoàn tất toàn bộ tiến trình gửi.`);
        }
      }
    } catch (err) {
      console.error('❌ Lỗi cập nhật tiến độ chiến dịch:', err.message);
    }
  });

  worker.on('failed', async (job, err) => {
    console.error(`❌ [Job ${job?.id} Failed]: ${err.message} (Lần thử: ${job?.attemptsMade})`);

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