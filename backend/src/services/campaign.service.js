import campaignRepository from '../repositories/campaign.repository.js';
import contactRepository from '../repositories/contact.repository.js';
import { emailQueue } from '../queues/email.queue.js';
import Contact from '../models/Contact.js';
import ApiError from '../utils/apiError.util.js';
import Tenant from '../models/Tenant.js';

class CampaignService {
  async createCampaign(tenantId, data) {
    if (!data.name || !data.subject || !data.contentHtml) {
      throw new ApiError(400, 'Tên chiến dịch, tiêu đề và nội dung email là bắt buộc.');
    }

    return await campaignRepository.create({
      ...data,
      tenantId,
      status: 'DRAFT'
    });
  }

  async getCampaigns(tenantId, query) {
    const { page = 1, limit = 10, status, search } = query;
    const filter = { tenantId };

    if (status && status !== 'ALL') filter.status = status;
    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    return await campaignRepository.findAll(filter, { page, limit });
  }

  async getCampaignById(id, tenantId) {
    const campaign = await campaignRepository.findById(id, tenantId);
    if (!campaign) throw new ApiError(404, 'Không tìm thấy chiến dịch.');
    return campaign;
  }

  async updateCampaign(id, tenantId, updateData) {
    const campaign = await campaignRepository.findById(id, tenantId);
    if (!campaign) throw new ApiError(404, 'Không tìm thấy chiến dịch để cập nhật.');

    if (campaign.status === 'PROCESSING' || campaign.status === 'COMPLETED') {
      throw new ApiError(400, 'Không thể chỉnh sửa chiến dịch đã hoặc đang phát tán.');
    }

    return await campaignRepository.updateById(id, tenantId, updateData);
  }

  async deleteCampaign(id, tenantId) {
    const campaign = await campaignRepository.findById(id, tenantId);
    if (!campaign) throw new ApiError(404, 'Không tìm thấy chiến dịch để xóa.');

    if (campaign.status === 'PROCESSING') {
      throw new ApiError(400, 'Không thể xóa chiến dịch đang phát tán.');
    }

    return await campaignRepository.deleteById(id, tenantId);
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

    // 1. Xác định gói cước & trọng số ưu tiên SLA P(t)
    const tenant = await Tenant.findById(tenantId).select('plan subscriptionPlan');
    const plan = (tenant?.plan || tenant?.subscriptionPlan || 'FREE').toUpperCase();

    const slaConfig = {
      FREE: { slaSeconds: 60, weightTier: 0, priority: 10 },
      PRO: { slaSeconds: 15, weightTier: 5, priority: 5 },
      ENTERPRISE: { slaSeconds: 5, weightTier: 10, priority: 2 } // Ưu tiên cao nhất của Mkt là P = 2
    };
    const tierConfig = slaConfig[plan] || slaConfig.FREE;

    // 2. Lọc danh sách người nhận
    const contactFilter = { tenantId, status: 'SUBSCRIBED' };
    
    if (campaign.targetSegment && campaign.targetSegment !== 'ALL') {
      contactFilter.segment = campaign.targetSegment;
    }

    if (campaign.targetTags && campaign.targetTags.length > 0) {
      contactFilter.tags = { $in: campaign.targetTags };
    }

    const recipients = await Contact.find(contactFilter).select('email firstName lastName company');

    if (recipients.length === 0) {
      throw new ApiError(400, 'Không tìm thấy khách hàng nào phù hợp với điều kiện để gửi chiến dịch.');
    }

    // 3. Chuẩn bị Bulk Jobs cho BullMQ (ĐÃ BỔ SUNG createdAt VÀ type)
    const jobs = recipients.map((contact) => {
      let personalizedHtml = (campaign.contentHtml || '')
        .replace(/{{firstName}}/g, contact.firstName || 'Quý khách')
        .replace(/{{lastName}}/g, contact.lastName || '')
        .replace(/{{company}}/g, contact.company || 'Doanh nghiệp')
        .replace(/{{email}}/g, contact.email)
        .replace(/{{unsubscribeUrl}}/g, `https://verdio.io/unsubscribe?cid=${campaign._id}&email=${contact.email}`);

      return {
        name: `campaign-job-${campaign._id}-${contact._id}`,
        data: {
          to: contact.email,
          fromName: campaign.fromName || 'VERDIO System',
          subject: campaign.subject,
          html: personalizedHtml,
          tenantId: tenantId.toString(),
          campaignId: campaign._id.toString(),
          recipientId: contact._id.toString(),
          type: 'MARKETING',         // 👈 BỔ SUNG: Phân loại job tiếp thị
          createdAt: Date.now(),      // 👈 BỔ SUNG: Timestamp gốc để Aging Scanner & SLA đo đạc
          slaSeconds: tierConfig.slaSeconds,
          weightTier: tierConfig.weightTier
        },
        opts: {
          jobId: `campaign-${campaign._id}-contact-${contact._id}`,
          priority: tierConfig.priority,
          removeOnComplete: true,
          removeOnFail: false
        }
      };
    });

    // 4. Đẩy hàng loạt vào BullMQ
    await emailQueue.addBulk(jobs);

    // 5. Cập nhật Quota tiêu thụ
    await Tenant.findByIdAndUpdate(tenantId, {
      $inc: { 'usage.emailsSentThisMonth': recipients.length }
    });

    // 6. Cập nhật trạng thái chiến dịch
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

  async getCampaignQueueStatus(id, tenantId) {
    const campaign = await campaignRepository.findById(id, tenantId);
    if (!campaign) throw new ApiError(404, 'Không tìm thấy chiến dịch.');

    const waitingJobs = await emailQueue.getJobs(['waiting', 'delayed', 'prioritized']);
    const activeJobs = await emailQueue.getJobs(['active']);

    const waitingCount = waitingJobs.filter(j => j?.data?.campaignId === id.toString()).length;
    const activeCount = activeJobs.filter(j => j?.data?.campaignId === id.toString()).length;

    const totalRecipients = campaign.stats?.totalRecipients || 0;
    const sentCount = campaign.stats?.sentCount || 0;
    const failedCount = campaign.stats?.failedCount || 0;
    const openedCount = campaign.stats?.openedCount || 0;
    const clickedCount = campaign.stats?.clickedCount || 0;

    const isFinished = campaign.status === 'COMPLETED' || (waitingCount === 0 && activeCount === 0 && campaign.status !== 'DRAFT');

    return {
      waiting: waitingCount,
      active: activeCount,
      completed: isFinished ? (sentCount || totalRecipients) : sentCount,
      failed: failedCount,
      opened: openedCount,
      clicked: clickedCount,
      total: totalRecipients,
      status: isFinished && campaign.status === 'PROCESSING' ? 'COMPLETED' : campaign.status
    };
  }
}

export default new CampaignService();