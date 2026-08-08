import Plan from '../models/Plan.js';
import { PLAN_CODES } from '../constants/billing/plans.js';

/**
 * Thực thi nạp dữ liệu cấu hình các gói cước hệ thống (SaaS Plans Registry)
 * @param {boolean} overwrite - Cờ cho phép ghi đè dữ liệu cũ (Mặc định: false)
 * @returns {Promise<void>}
 */
export const seedPlans = async (overwrite = false) => {
  const planSeeds = [
    {
      code: PLAN_CODES.FREE,
      name: 'Free Tier',
      monthlyPrice: 0,
      yearlyPrice: 0,
      currency: 'USD',
      version: 1,
      limits: { maxContacts: 500, maxEmailsPerMonth: 1000, maxCampaigns: 3, maxWorkflows: 1, maxTeamMembers: 1 },
      features: { aiAssistant: false, automation: false, webhook: false, apiAccess: false, customSMTP: false, analytics: true },
      isActive: true
    },
    {
      code: PLAN_CODES.STARTER,
      name: 'Starter Pack',
      monthlyPrice: 29,
      yearlyPrice: 290,
      currency: 'USD',
      version: 1,
      limits: { maxContacts: 5000, maxEmailsPerMonth: 50000, maxCampaigns: 20, maxWorkflows: 5, maxTeamMembers: 3 },
      features: { aiAssistant: false, automation: true, webhook: false, apiAccess: false, customSMTP: false, analytics: true },
      isActive: true
    },
    {
      code: PLAN_CODES.PROFESSIONAL,
      name: 'Professional Hub',
      monthlyPrice: 99,
      yearlyPrice: 990,
      currency: 'USD',
      version: 1,
      limits: { maxContacts: 50000, maxEmailsPerMonth: 500000, maxCampaigns: 100, maxWorkflows: 20, maxTeamMembers: 10 },
      features: { aiAssistant: true, automation: true, webhook: true, apiAccess: true, customSMTP: true, analytics: true },
      isActive: true
    },
    {
      code: PLAN_CODES.ENTERPRISE,
      name: 'Enterprise Core',
      monthlyPrice: 499,
      yearlyPrice: 4990,
      currency: 'USD',
      version: 1,
      limits: { maxContacts: -1, maxEmailsPerMonth: -1, maxCampaigns: -1, maxWorkflows: -1, maxTeamMembers: -1 }, // -1 biểu thị Không giới hạn
      features: { aiAssistant: true, automation: true, webhook: true, apiAccess: true, customSMTP: true, analytics: true },
      isActive: true
    }
  ];

  try {
    // 1. Kiểm tra nếu đã có dữ liệu và không bật cờ ghi đè
    const existingCount = await Plan.countDocuments();
    if (existingCount > 0 && !overwrite) {
      console.log(`ℹ️ [Plan Seeder Info]: Phát hiện ${existingCount} gói cước đã tồn tại trong DB. Bỏ qua Seeding để bảo vệ dữ liệu hiện hành.`);
      return;
    }

    if (overwrite) {
      console.log('⚠️ [Plan Seeder Warning]: Phát hiện cờ Overwrite = true. Hệ thống sẽ tiến hành đồng bộ và ghi đè cấu hình Plans...');
    }

    // 2. Chuẩn bị mảng Operations cho bulkWrite kết hợp Upsert
    const operations = planSeeds.map(plan => ({
      updateOne: {
        filter: { code: plan.code },
        update: { $set: plan },
        upsert: true // Tạo mới nếu chưa có, cập nhật nếu đã có dựa trên filter code
      }
    }));

    // 3. Thực thi truy vấn Bulk Write nguyên tử
    const result = await Plan.bulkWrite(operations);
    
    console.log('🌱 [Plan Seeder Success]: Quá trình đồng bộ hóa danh mục Plans hoàn tất!');
    console.log(`📊 Kết quả: Khởi tạo mới (Upserted): ${result.upsertedCount}, Cập nhật (Modified): ${result.modifiedCount}`);
  } catch (error) {
    throw new Error(`❌ [Plan Seeder Error]: Quá trình khởi tạo danh mục gói cước thất bại: ${error.message}`);
  }
};