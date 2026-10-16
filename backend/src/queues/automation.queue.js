import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis.js'; // Dùng chung kết nối Redis chuẩn của hệ thống
import AutomationExecution from '../models/AutomationExecution.js';
import Automation from '../models/Automation.js';
import Contact from '../models/Contact.js';
import Template from '../models/Template.js';
import { emailQueue } from './email.queue.js';

// Khởi tạo Queue kết nối trực tiếp với Upstash Redis Cloud
export const automationQueue = new Queue('automation-workflow-queue', { connection: redis });

/**
 * Hàm chuyển đổi đơn vị thời gian DELAY sang Milliseconds
 */
function calculateDelayMs(value, unit) {
  const num = Math.max(1, Number(value) || 1);
  switch (unit) {
    case 'MINUTES':
      return num * 60 * 1000;
    case 'HOURS':
      return num * 60 * 60 * 1000;
    case 'DAYS':
      return num * 24 * 60 * 60 * 1000;
    default:
      return num * 60 * 60 * 1000;
  }
}

/**
 * Khởi tạo Worker xử lý từng bước của kịch bản (Được gọi khởi tạo khi boot ứng dụng)
 */
export const initAutomationWorker = (concurrency = 2) => {
  const worker = new Worker(
    'automation-workflow-queue',
    async (job) => {
      const { executionId } = job.data;

      const execution = await AutomationExecution.findById(executionId);
      if (!execution || execution.status !== 'IN_PROGRESS') return;

      const [automation, contact] = await Promise.all([
        Automation.findById(execution.automationId),
        Contact.findById(execution.contactId)
      ]);

      if (!automation || automation.status !== 'ACTIVE' || !contact) {
        execution.status = 'CANCELLED';
        await execution.save();
        return;
      }

      const steps = automation.steps || [];
      const currentIndex = execution.currentStepIndex;

      // 1. Kiểm tra nếu đã hoàn tất toàn bộ các bước trong kịch bản
      if (currentIndex >= steps.length) {
        execution.status = 'COMPLETED';
        execution.nextExecutionAt = null;
        await Promise.all([
          execution.save(),
          Automation.findByIdAndUpdate(automation._id, { $inc: { 'stats.totalCompleted': 1 } })
        ]);
        console.log(`🎉 [Automation Finished]: Contact ${contact.email} đã hoàn tất kịch bản "${automation.name}"`);
        return;
      }

      const currentStep = steps[currentIndex];

      try {
        // 2. Thực thi nghiệp vụ tương ứng với loại Step
        switch (currentStep.type) {
          case 'SEND_EMAIL': {
            const template = await Template.findById(currentStep.config.templateId);
            if (template && contact.status === 'SUBSCRIBED') {
              const backendUrl = process.env.BACKEND_BASE_URL || 'https://verdio-backend.onrender.com';
              
              let html = (template.htmlContent || '')
                .replace(/{{firstName}}/g, contact.firstName || 'Quý khách')
                .replace(/{{lastName}}/g, contact.lastName || '')
                .replace(/{{company}}/g, contact.company || 'Doanh nghiệp')
                .replace(/{{email}}/g, contact.email)
                .replace(
                  /{{unsubscribeUrl}}/g, 
                  `${backendUrl}/api/contacts/unsubscribe?email=${contact.email}&tenantId=${execution.tenantId}`
                );

              // Bắn sang emailQueue để tận dụng hạ tầng gửi email & SLA của hệ thống
              await emailQueue.add(`auto-email-${contact._id}`, {
                to: contact.email,
                subject: template.subject,
                html,
                tenantId: execution.tenantId.toString(),
                recipientId: contact._id.toString()
              });
            }
            break;
          }

          case 'ADD_TAG': {
            if (currentStep.config.tag) {
              await Contact.findByIdAndUpdate(contact._id, {
                $addToSet: { tags: currentStep.config.tag.trim() }
              });
            }
            break;
          }

          case 'UPDATE_SEGMENT': {
            if (currentStep.config.segment) {
              await Contact.findByIdAndUpdate(contact._id, {
                segment: currentStep.config.segment
              });
            }
            break;
          }

          case 'DELAY': {
            const delayMs = calculateDelayMs(currentStep.config.delayValue, currentStep.config.delayUnit);
            const nextExecutionDate = new Date(Date.now() + delayMs);

            execution.currentStepIndex = currentIndex + 1;
            execution.nextExecutionAt = nextExecutionDate;
            execution.logs.push({
              stepId: currentStep.id,
              stepType: 'DELAY',
              status: 'SUCCESS',
              message: `Tạm dừng ${currentStep.config.delayValue} ${currentStep.config.delayUnit}`
            });
            await execution.save();

            // Lên lịch BullMQ đánh thức job sau delayMs
            await automationQueue.add(
              `resume-workflow-${execution._id}`,
              { executionId: execution._id.toString() },
              { delay: delayMs }
            );
            return;
          }

          default:
            break;
        }

        // 3. Ghi log thành công và chuyển sang bước tiếp theo ngay lập tức
        execution.logs.push({
          stepId: currentStep.id,
          stepType: currentStep.type,
          status: 'SUCCESS',
          message: `Hoàn tất bước ${currentStep.type}`
        });

        execution.currentStepIndex = currentIndex + 1;
        await execution.save();

        // Đẩy job kích hoạt bước tiếp theo
        await automationQueue.add(`next-step-${execution._id}`, {
          executionId: execution._id.toString()
        });
      } catch (err) {
        execution.logs.push({
          stepId: currentStep.id,
          stepType: currentStep.type,
          status: 'FAILED',
          message: err.message
        });
        execution.status = 'FAILED';
        await execution.save();
      }
    },
    { connection: redis, concurrency }
  );

  worker.on('completed', (job) => {
    console.log(`✅ [Automation Worker]: Job #${job.id} hoàn tất.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ [Automation Worker]: Job #${job.id} thất bại:`, err.message);
  });

  console.log(`🤖 [BullMQ Engine]: Automation Background Worker đã sẵn sàng (Concurrency: ${concurrency}).`);
  return worker;
};