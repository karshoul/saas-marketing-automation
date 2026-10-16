import tenantService from '../services/tenant.service.js';
import { success } from '../utils/response.util.js';
import Membership from '../models/Membership.js';

class TenantController {
  
  /**
   * Helper nội bộ: Xác định đúng Workspace ID đang được kích hoạt (Token hoặc Header override)
   */
  async _resolveActiveTenantId(req) {
    const userDefaultTenantId = req.user.tenantId;
    const headerTenantId = req.headers['x-workspace-id'];
    const userId = req.user.id || req.user._id;

    if (headerTenantId && headerTenantId !== userDefaultTenantId) {
      const membership = await Membership.findOne({ tenantId: headerTenantId, userId, status: 'ACTIVE' });
      if (membership) return headerTenantId;
    }
    return userDefaultTenantId;
  }

  /**
   * Lấy hồ sơ chi tiết của Workspace hiện tại
   */
  async getMyTenant(req, res, next) {
    try {
      const tenantId = await this._resolveActiveTenantId(req);
      const userId = req.user.id || req.user._id;

      const { tenant, role } = await tenantService.getMyTenantWithRole(tenantId, userId);

      return success(res, 'Tải cấu hình Workspace thành công.', { tenant, role });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cập nhật thông tin vận hành Workspace (Đổi tên)
   */
  async updateMyTenant(req, res, next) {
    try {
      const tenantId = await this._resolveActiveTenantId(req);
      const updatedTenant = await tenantService.updateTenant(tenantId, req.body);
      
      return success(res, 'Cập nhật thông tin Workspace thành công.', { tenant: updatedTenant });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy danh sách tất cả các Workspace mà user đang tham gia
   */
  async getMyWorkspaces(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const workspaces = await tenantService.getUserWorkspaces(userId);
      
      return success(res, 'Tải danh sách không gian làm việc thành công.', { workspaces });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tạo mới / Xoay vòng Khóa API
   */
  async regenerateApiKey(req, res, next) {
    try {
      const tenantId = await this._resolveActiveTenantId(req);
      const newApiKey = await tenantService.regenerateApiKey(tenantId);

      return success(res, 'Đã tạo mới khóa API thành công!', { apiKey: newApiKey });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cập nhật cấu hình cổng gửi thư SMTP riêng
   */
  async updateTenantSmtp(req, res, next) {
    try {
      const tenantId = await this._resolveActiveTenantId(req);
      const tenant = await tenantService.updateSmtpConfig(tenantId, req.body);

      return success(res, 'Cập nhật cấu hình SMTP thành công!', { tenant });
    } catch (error) {
      next(error);
    }
  }
}

// Bind 'this' context cho các async handler
const controller = new TenantController();
controller.getMyTenant = controller.getMyTenant.bind(controller);
controller.updateMyTenant = controller.updateMyTenant.bind(controller);
controller.getMyWorkspaces = controller.getMyWorkspaces.bind(controller);
controller.regenerateApiKey = controller.regenerateApiKey.bind(controller);
controller.updateTenantSmtp = controller.updateTenantSmtp.bind(controller);

export default controller;