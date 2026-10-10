import tenantService from '../services/tenant.service.js';
import { success } from '../utils/response.util.js';
import Membership from '../models/Membership.js';
import Tenant from '../models/Tenant.js';
import ApiError from '../utils/apiError.util.js';
import crypto from 'crypto';

class TenantController {
  
 /**
   * Lấy hồ sơ chi tiết của Workspace hiện tại
   */
  async getMyTenant(req, res, next) {
    try {
      // 🔥 SỬA LẠI THỨ TỰ ƯU TIÊN: Ưu tiên tenantId chính chủ trong JWT Token trước, 
      // chỉ dùng header x-workspace-id nếu thực sự có override chuyển workspace.
      const userDefaultTenantId = req.user.tenantId;
      const headerTenantId = req.headers['x-workspace-id'];
      
      const userId = req.user.id || req.user._id;

      // Nếu header gửi lên khác với workspace chính chủ trong token, 
      // phải kiểm tra xem user này có thực sự thuộc workspace đó không (bảo mật chống truy cập trái phép)
      let tenantId = userDefaultTenantId;
      if (headerTenantId && headerTenantId !== userDefaultTenantId) {
        const membershipCheck = await Membership.findOne({ tenantId: headerTenantId, userId, status: 'ACTIVE' });
        if (membershipCheck) {
          tenantId = headerTenantId; // Chỉ cho phép đổi sang workspace khác nếu có membership active
        }
      }

      const tenant = await tenantService.getTenantById(tenantId);
      
      // Truy vấn tìm vai trò thực tế của user trong Workspace này qua bảng Membership
      const membership = await Membership.findOne({ tenantId, userId });
      const role = membership 
        ? membership.role 
        : (tenant.ownerId?.toString() === userId.toString() ? 'OWNER' : 'MEMBER');

      return success(res, 'Tải cấu hình Workspace thành công.', { 
        tenant, 
        role 
      });
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

  /**
   * 🔥 BỔ SUNG: Lấy danh sách tất cả các Workspace mà user hiện tại đang tham gia (Multi-tenant)
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
   * 🔥 BỔ SUNG: Tạo mới / Xoay vòng Khóa API (Live API Key) cho Workspace
   */
  async regenerateApiKey(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const newApiKey = `vdo_live_${crypto.randomBytes(16).toString('hex')}`;

      const tenant = await Tenant.findByIdAndUpdate(
        tenantId,
        { apiKey: newApiKey },
        { new: true }
      );

      if (!tenant) {
        throw new ApiError(404, 'Không tìm thấy không gian làm việc.');
      }

      return success(res, 'Đã tạo mới khóa API thành công!', { apiKey: newApiKey });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 🔥 BỔ SUNG: Cập nhật cấu hình cổng gửi thư SMTP riêng cho Workspace
   */
  async updateTenantSmtp(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { host, port, user, pass, senderEmail } = req.body;

      const tenant = await Tenant.findByIdAndUpdate(
        tenantId,
        {
          smtpConfig: {
            host: host || '',
            port: port || 465,
            user: user || '',
            pass: pass || '',
            senderEmail: senderEmail || ''
          }
        },
        { new: true }
      );

      if (!tenant) {
        throw new ApiError(404, 'Không tìm thấy không gian làm việc.');
      }

      return success(res, 'Cập nhật cấu hình SMTP thành công!', { tenant });
    } catch (error) {
      next(error);
    }
  }

}

export default new TenantController();