import templateService from '../services/template.service.js';
import { success, created } from '../utils/response.util.js';

class TemplateController {
  async create(req, res, next) {
    try {
      const template = await templateService.createTemplate(req.user.tenantId, req.body);
      return created(res, 'Tạo mẫu thư mới thành công.', template);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await templateService.getTemplates(req.user.tenantId, req.query);
      return success(res, 'Lấy danh sách mẫu thư thành công.', result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const template = await templateService.getTemplateById(req.params.id, req.user.tenantId);
      return success(res, 'Lấy chi tiết mẫu thư thành công.', template);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const updated = await templateService.updateTemplate(req.params.id, req.user.tenantId, req.body);
      return success(res, 'Cập nhật mẫu thư thành công.', updated);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await templateService.deleteTemplate(req.params.id, req.user.tenantId);
      return success(res, 'Đã xóa mẫu thư thành công.');
    } catch (error) {
      next(error);
    }
  }

  async clone(req, res, next) {
    try {
      const cloned = await templateService.cloneTemplate(req.params.id, req.user.tenantId);
      return created(res, 'Nhân bản mẫu thư thành công.', cloned);
    } catch (error) {
      next(error);
    }
  }
}

export default new TemplateController();