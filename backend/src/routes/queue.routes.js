import { Router } from 'express';
import { emailQueue } from '../queues/email.queue.js';
import workerScaler from '../schedulers/worker.scaler.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateUser);

/**
 * @route   GET /api/queue/stats
 * @desc    Lấy chỉ số thời gian thực của BullMQ và Worker Autoscaler
 */
router.get('/stats', async (req, res, next) => {
  try {
    const [counts, scalerMetrics] = await Promise.all([
      emailQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'prioritized'),
      workerScaler.getMetrics()
    ]);

    // Lấy 15 jobs mới nhất trong trạng thái waiting/active để inspect điểm P(t)
    const [waitingJobs, activeJobs] = await Promise.all([
      emailQueue.getJobs(['waiting', 'prioritized'], 0, 10, true),
      emailQueue.getJobs(['active'], 0, 5, true)
    ]);

    const formatJob = (job) => ({
      id: job.id,
      name: job.name,
      to: job.data?.to,
      campaignId: job.data?.campaignId,
      priority: job.opts?.priority || 1,
      slaSeconds: job.data?.slaSeconds || 60,
      createdAt: job.timestamp,
      attemptsMade: job.attemptsMade,
      state: job.processedOn ? 'active' : 'waiting'
    });

    return res.json({
      success: true,
      data: {
        counts: {
          waiting: (counts.waiting || 0) + (counts.prioritized || 0),
          active: counts.active || 0,
          completed: counts.completed || 0,
          failed: counts.failed || 0,
          delayed: counts.delayed || 0,
          total: Object.values(counts).reduce((a, b) => a + b, 0)
        },
        scaler: scalerMetrics, // { currentConcurrency, minConcurrency, maxConcurrency }
        liveJobs: [...activeJobs, ...waitingJobs].map(formatJob)
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;