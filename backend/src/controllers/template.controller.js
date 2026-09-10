import Template from '../models/Template.js';
import { success } from '../utils/response.util.js';

class TemplateController {
  async getAll(req, res, next) {
    try {
      const { category, search } = req.query;
      const query = { tenantId: req.user.tenantId };

      if (category) query.category = category;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } }
        ];
      }

      const templates = await Template.find(query).sort({ updatedAt: -1 });
      return success(res, 'Lấy danh sách mẫu thành công.', templates);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const { name, subject, category, contentHtml, variables } = req.body;
      const template = await Template.create({
        tenantId: req.user.tenantId,
        name,
        subject,
        category: category || 'MARKETING',
        contentHtml,
        variables: variables || ['firstName', 'email']
      });
      return success(res, 'Tạo mẫu tin thành công.', template, 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const template = await Template.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.user.tenantId },
        req.body,
        { new: true }
      );
      if (!template) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy mẫu tin.' });
      }
      return success(res, 'Cập nhật mẫu tin thành công.', template);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const template = await Template.findOneAndDelete({
        _id: req.params.id,
        tenantId: req.user.tenantId
      });
      if (!template) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy mẫu tin.' });
      }
      return success(res, 'Xóa mẫu tin thành công.');
    } catch (err) {
      next(err);
    }
  }
}

export default new TemplateController();