import tenantRepository from '../repositories/tenant.repository.js';
import contactRepository from '../repositories/contact.repository.js';
import Campaign from '../models/Campaign.js';
import Contact from '../models/Contact.js';
import { SUBSCRIPTION_PLANS } from '../config/plans.config.js';
import ApiError from '../utils/apiError.util.js';

/**
 * 1. Kiểm tra Giới hạn Contacts (Dùng cho contact.routes.js)
 */
export const checkContactQuota = async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const tenant = await tenantRepository.findById(tenantId);

    if (!tenant) throw new ApiError(404, 'Không tìm thấy Workspace.');

    const currentPlanCode = (tenant.subscriptionPlan || tenant.plan || 'FREE').toUpperCase();
    const planConfig = SUBSCRIPTION_PLANS[currentPlanCode] || SUBSCRIPTION_PLANS.FREE;

    // Đếm số lượng contact hiện có của Tenant
    const totalContacts = await contactRepository.countByTenant(tenantId);

    if (totalContacts >= planConfig.maxContacts) {
      throw new ApiError(
        403,
        `Workspace đã đạt giới hạn tối đa ${planConfig.maxContacts.toLocaleString()} contacts của gói ${planConfig.name}. Vui lòng nâng cấp gói để tiếp tục.`
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Kiểm tra Hạn ngạch Email trước khi phát tán Chiến dịch (Dùng cho campaign.routes.js)
 */
export const checkCampaignQuota = async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const campaignId = req.params.id;

    const [tenant, campaign] = await Promise.all([
      tenantRepository.findById(tenantId),
      Campaign.findOne({ _id: campaignId, tenantId })
    ]);

    if (!tenant) throw new ApiError(404, 'Không tìm thấy Workspace.');
    if (!campaign) throw new ApiError(404, 'Không tìm thấy Chiến dịch.');

    const planCode = (tenant.subscriptionPlan || tenant.plan || 'FREE').toUpperCase();
    const planConfig = SUBSCRIPTION_PLANS[planCode] || SUBSCRIPTION_PLANS.FREE;

    const monthlyLimit = tenant.quotas?.monthlyEmailLimit || planConfig.monthlyEmailLimit || 3000;
    const currentSent = tenant.usage?.emailsSentThisMonth || 0;

    // Tính toán số lượng người nhận thực tế của chiến dịch
    let recipientsCount = campaign.stats?.totalRecipients || 0;
    if (recipientsCount === 0) {
      recipientsCount = await Contact.countDocuments({
        tenantId,
        status: { $ne: 'UNSUBSCRIBED' }
      });
    }

    // Kiểm tra vượt hạn ngạch
    if (currentSent + recipientsCount > monthlyLimit) {
      const remaining = Math.max(0, monthlyLimit - currentSent);
      throw new ApiError(
        403,
        `Vượt quá hạn ngạch gửi thư! Gói ${planConfig.name} của bạn chỉ còn lại ${remaining.toLocaleString()} lượt gửi trong tháng này (Chiến dịch yêu cầu ${recipientsCount.toLocaleString()} emails). Vui lòng nâng cấp gói để tiếp tục.`
      );
    }

    req.quotaInfo = { recipientsCount, tenant };
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Khóa tính năng SLA Khẩn cấp đối với gói FREE
 */
export const checkFeatureAccess = (requiredFeature) => {
  return async (req, res, next) => {
    try {
      const { tenantId } = req.user;
      const tenant = await tenantRepository.findById(tenantId);
      const planCode = (tenant?.subscriptionPlan || tenant?.plan || 'FREE').toUpperCase();

      if (requiredFeature === 'HIGH_PRIORITY_SLA' && planCode === 'FREE') {
        const requestedSla = req.body?.slaSeconds || req.body?.sla;
        if (requestedSla && Number(requestedSla) < 60) {
          throw new ApiError(
            403,
            'Tính năng phát tán hỏa tốc (SLA < 60s) chỉ khả dụng từ gói PRO trở lên.'
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};