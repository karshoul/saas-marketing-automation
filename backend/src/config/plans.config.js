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