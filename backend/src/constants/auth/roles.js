/**
 * Hệ thống phân quyền dựa trên vai trò (Role-Based Access Control)
 * áp dụng trong nội bộ không gian làm việc của mỗi Tenant.
 */
export const ROLES = {
  OWNER: 'OWNER',     // Chủ sở hữu tối cao của Workspace, có quyền Billing và quản lý Team
  ADMIN: 'ADMIN',     // Quản trị viên hệ thống, có quyền quản lý Team nhưng không can thiệp Billing
  MANAGER: 'MANAGER', // Trưởng nhóm nghiệp vụ, toàn quyền thao tác Campaign, Audience, Automation
  MEMBER: 'MEMBER'    // Nhân viên vận hành, chỉ được xem báo cáo hoặc tạo bản nháp chiến dịch
};