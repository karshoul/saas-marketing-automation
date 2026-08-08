/**
 * Mã phân cấp gói cước dịch vụ SaaS của nền tảng VERDIO.
 */
export const PLAN_CODES = {
  FREE: 'FREE',                 // Gói miễn phí thử nghiệm, hạn mức tối thiểu, không có AI/Automation
  STARTER: 'STARTER',           // Gói khởi nghiệp, mở khóa Automation cơ bản
  PROFESSIONAL: 'PROFESSIONAL', // Gói chuyên nghiệp, mở khóa toàn bộ Webhook, API và AI Assistant
  ENTERPRISE: 'ENTERPRISE'       // Gói doanh nghiệp lớn, không giới hạn tài nguyên lưu trữ và băng thông
};

/**
 * Cấu hình các loại chu kỳ tính cước thương mại.
 */
export const BILLING_CYCLES = {
  MONTHLY: 'MONTHLY', // Thu phí định kỳ theo chu kỳ từng tháng
  YEARLY: 'YEARLY'    // Thu phí định kỳ theo chu kỳ trọn gói cả năm (thường đi kèm ưu đãi chiết khấu)
};