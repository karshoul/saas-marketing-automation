import adminService from '../services/admin.service.js';
import { success } from '../utils/response.util.js';

class AdminController {
  // Lấy danh sách Tenant toàn cụm
  async getTenants(req, res, next) {
    try {
      const { page, limit, search } = req.query;
      const data = await adminService.getAllTenants({ page, limit, search });
      return success(res, 'Tải danh sách Workspace toàn cụm thành công.', data);
    } catch (error) {
      next(error);
    }
  }

  // Khóa / Mở khóa Tenant
  async updateStatus(req, res, next) {
    try {
      const { tenantId } = req.params;
      const { status } = req.body;
      const tenant = await adminService.toggleTenantStatus(tenantId, status);
      return success(res, 'Cập nhật trạng thái Tenant thành công.', { tenant });
    } catch (error) {
      next(error);
    }
  }

  // Thay đổi Gói cước và Quota thủ công
  async updatePlan(req, res, next) {
    try {
      const { tenantId } = req.params;
      const { plan, customQuota } = req.body;
      const tenant = await adminService.updateTenantPlan(tenantId, { plan, customQuota });
      return success(res, 'Điều chỉnh phân quyền gói cước thành công.', { tenant });
    } catch (error) {
      next(error);
    }
  }

  // Chạy Benchmark tải thực nghiệm phục vụ làm số liệu đồ án
  async triggerBenchmark(req, res, next) {
    try {
      const { workloadSize, burstRatio } = req.body;
      const results = await adminService.runBenchmarkSimulation({ workloadSize, burstRatio });
      return success(res, 'Thực thi bài kiểm thử Benchmark tải thành công.', results);
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();