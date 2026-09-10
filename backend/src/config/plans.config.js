import Plan from '../models/Plan.js';

export const SUBSCRIPTION_PLANS = {
  FREE: {
    code: 'FREE',
    name: 'Gói Miễn Phí',
    price: 0,
    maxContacts: 500,
    maxEmailsPerMonth: 1000,
    maxWorkers: 1,
    features: ['basic_campaigns', 'standard_templates']
  },
  PRO: {
    code: 'PRO',
    name: 'Gói Chuyên Nghiệp',
    price: 499000, // VNĐ / Tháng
    maxContacts: 10000,
    maxEmailsPerMonth: 50000,
    maxWorkers: 5,
    features: ['basic_campaigns', 'standard_templates', 'automation_workflows', 'smart_scheduler']
  },
  ENTERPRISE: {
    code: 'ENTERPRISE',
    name: 'Gói Doanh Nghiệp',
    price: 1999000, // VNĐ / Tháng
    maxContacts: 100000,
    maxEmailsPerMonth: 500000,
    maxWorkers: 20,
    features: ['all']
  }
};

/**
 * Hàm tự động nạp dữ liệu các gói cước vào Database nếu chưa tồn tại
 */
export const seedPlans = async () => {
  try {
    const plansToInsert = Object.values(SUBSCRIPTION_PLANS);
    for (const plan of plansToInsert) {
      await Plan.findOneAndUpdate(
        { code: plan.code },
        { $set: plan },
        { upsert: true, new: true }
      );
    }
    console.log('✅ [Auto-Seed]: Đã đồng bộ các gói cước FREE / PRO / ENTERPRISE vào MongoDB thành công!');
  } catch (error) {
    console.error('❌ [Auto-Seed Error]: Lỗi khi đồng bộ gói cước:', error.message);
  }
};