import automationService from '../services/automation.service.js';
import { success, created } from '../utils/response.util.js';

class AutomationController {
  async create(req, res, next) {
    try {
      const automation = await automationService.createAutomation(req.user.tenantId, req.body);
      return created(res, 'Tạo kịch bản tự động thành công.', automation);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await automationService.getAutomations(req.user.tenantId, req.query);
      return success(res, 'Lấy danh sách kịch bản thành công.', result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const automation = await automationService.getAutomationById(req.params.id, req.user.tenantId);
      return success(res, 'Lấy chi tiết kịch bản thành công.', automation);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const updated = await automationService.updateAutomation(req.params.id, req.user.tenantId, req.body);
      return success(res, 'Cập nhật kịch bản thành công.', updated);
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const updated = await automationService.toggleStatus(req.params.id, req.user.tenantId);
      return success(res, `Đã chuyển trạng thái kịch bản sang ${updated.status}.`, updated);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await automationService.deleteAutomation(req.params.id, req.user.tenantId);
      return success(res, 'Đã xóa kịch bản tự động thành công.');
    } catch (error) {
      next(error);
    }
  }
}

export default new AutomationController();