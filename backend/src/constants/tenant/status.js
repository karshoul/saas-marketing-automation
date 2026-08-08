/**
 * Trạng thái hoạt động của thực thể Tenant (Workspace/Doanh nghiệp).
 */
export const TENANT_STATUS = {
  ACTIVE: 'active',       // Hoạt động bình thường
  SUSPENDED: 'suspended', // Bị khóa toàn cục (Do vi phạm điều khoản hoặc lý do bảo mật từ hệ thống)
  TRIAL: 'trial'          // Workspace mới tạo đang trong thời gian dùng thử hệ thống
};