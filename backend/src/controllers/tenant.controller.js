import tenantService from '../services/tenant.service.js';
import { success } from '../utils/response.util.js';

class TenantController {
  
  /**
   * Lấy hồ sơ chi tiết của Workspace hiện tại
   */
  async getMyTenant(req, res, next) {
    try {
      // req.user.tenantId được tiêm ngầm và bảo vệ từ lớp `authMiddleware`
      const tenantId = req.user.tenantId; 
      
      const tenant = await tenantService.getTenantById(tenantId);
      
      return success(res, 'Tải cấu hình Workspace thành công.', { tenant });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cập nhật thông tin vận hành Workspace (Đổi tên, cấu hình trạng thái)
   */
  async updateMyTenant(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      
      const updatedTenant = await tenantService.updateTenant(tenantId, req.body);
      
      return success(res, 'Cập nhật thông tin Workspace thành công.', { tenant: updatedTenant });
    } catch (error) {
      next(error);
    }
  }
}

export default new TenantController();