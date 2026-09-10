import campaignRepository from '../repositories/campaign.repository.js';
import contactRepository from '../repositories/contact.repository.js';
import { emailQueue } from '../queues/email.queue.js';
import Contact from '../models/Contact.js';
import ApiError from '../utils/apiError.util.js';
import Tenant from '../models/Tenant.js';

class CampaignService {
  async createCampaign(tenantId, data) {
    return await campaignRepository.create({
      ...data,
      tenantId,
      status: 'DRAFT'
    });
  }

  async getCampaigns(tenantId, query) {
    const { page = 1, limit = 10, status, search } = query;
    const filter = { tenantId };

    if (status) filter.status = status;
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    return await campaignRepository.findAll(filter, { page, limit });
  }

  async getCampaignById(id, tenantId) {
    const campaign = await campaignRepository.findById(id, tenantId);
    if (!campaign) throw new ApiError(404, 'Không tìm thấy chiến dịch.');
    return campaign;
  }

  /**
   * Kích hoạt phát tán chiến dịch vào Redis Queue
   */
  async triggerCampaign(id, tenantId) {
    const campaign = await campaignRepository.findById(id, tenantId);
    if (!campaign) {
      throw new ApiError(404, 'Không tìm thấy chiến dịch.');
    }

    if (campaign.status === 'PROCESSING' || campaign.status === 'QUEUED') {
      throw new ApiError(400, 'Chiến dịch này đang được xử lý hoặc đã nằm trong hàng đợi.');
    }

    // 1. Lấy thông tin Tenant để xác định gói cước & trọng số ưu tiên P(t)
    const tenant = await Tenant.findById(tenantId).select('plan subscriptionPlan');
    const plan = (tenant?.plan || tenant?.subscriptionPlan || 'FREE').toUpperCase();

    // Thiết lập SLA và trọng số W_tier theo gói cước
    // FREE: SLA 60s (W=0) | PRO: SLA 15s (W=5) | ENTERPRISE: SLA 5s (W=10)
    const slaConfig = {
      FREE: { slaSeconds: 60, weightTier: 0, priority: 10 },
      PRO: { slaSeconds: 15, weightTier: 5, priority: 5 },
      ENTERPRISE: { slaSeconds: 5, weightTier: 10, priority: 1 }
    };
    const tierConfig = slaConfig[plan] || slaConfig.FREE;

    // 2. Lọc danh sách contacts người nhận (chỉ lấy status SUBSCRIBED)
    const contactFilter = { tenantId, status: 'SUBSCRIBED' };
    if (campaign.targetTags && campaign.targetTags.length > 0) {
      contactFilter.tags = { $in: campaign.targetTags };
    }

    const recipients = await Contact.find(contactFilter).select('email firstName lastName');

    if (recipients.length === 0) {
      throw new ApiError(400, 'Không tìm thấy khách hàng nào phù hợp với điều kiện để gửi chiến dịch.');
    }

    // 3. Chuyển đổi thành cấu trúc Bulk Jobs cho BullMQ kèm metadata thuật toán P(t)
    const jobs = recipients.map((contact) => {
      const personalizedHtml = (campaign.contentHtml || '').replace(
        /{{firstName}}/g,
        contact.firstName || 'Quý khách'
      );

      return {
        name: `campaign-job-${campaign._id}-${contact._id}`,
        data: {
          to: contact.email,
          subject: campaign.subject,
          html: personalizedHtml,
          tenantId: tenantId.toString(),
          campaignId: campaign._id.toString(),
          recipientId: contact._id.toString(),
          slaSeconds: tierConfig.slaSeconds,
          weightTier: tierConfig.weightTier
        },
        opts: {
          jobId: `campaign-${campaign._id}-contact-${contact._id}`,
          priority: tierConfig.priority, // BullMQ: số càng nhỏ mức ưu tiên càng cao
          removeOnComplete: true,
          removeOnFail: false
        }
      };
    });

    // 4. Đẩy hàng loạt vào BullMQ
    await emailQueue.addBulk(jobs);

    // 5. Cập nhật số lượng tiêu thụ vào Quota của Tenant (Nguyên tử $inc)
    await Tenant.findByIdAndUpdate(tenantId, {
      $inc: { 'usage.emailsSentThisMonth': recipients.length }
    });

    // 6. Cập nhật trạng thái và chỉ số chiến dịch
    const updated = await campaignRepository.updateById(id, tenantId, {
      status: 'PROCESSING',
      sentAt: new Date(),
      'stats.totalRecipients': recipients.length
    });

    return {
      campaign: updated,
      queuedJobsCount: jobs.length,
      appliedTier: plan,
      slaSeconds: tierConfig.slaSeconds
    };
  }

  /**
   * Theo dõi trạng thái Queue của Chiến dịch Real-time
   */
  async getCampaignQueueStatus(id, tenantId) {
  const campaign = await campaignRepository.findById(id, tenantId);
  if (!campaign) throw new ApiError(404, 'Không tìm thấy chiến dịch.');

  // Lấy các job còn đang tồn tại trong Redis (nếu chiến dịch đang chạy dở)
  const waitingJobs = await emailQueue.getJobs(['waiting', 'delayed', 'prioritized']);
  const activeJobs = await emailQueue.getJobs(['active']);

  const waitingCount = waitingJobs.filter(j => j.data?.campaignId === id.toString()).length;
  const activeCount = activeJobs.filter(j => j.data?.campaignId === id.toString()).length;

  // Lấy số liệu bền vững từ DB
  const totalRecipients = campaign.stats?.totalRecipients || 0;
  const sentCount = campaign.stats?.sentCount || 0;
  const failedCount = campaign.stats?.failedCount || 0;

  // Nếu trong Redis không còn job nào (đã chạy xong hoặc removeOnComplete), dùng số liệu từ DB
  const isFinished = campaign.status === 'COMPLETED' || (waitingCount === 0 && activeCount === 0);

  return {
    waiting: waitingCount,
    active: activeCount,
    completed: isFinished ? (sentCount || totalRecipients) : sentCount,
    failed: failedCount,
    total: totalRecipients,
    status: campaign.status
  };
}

}
export default new CampaignService();