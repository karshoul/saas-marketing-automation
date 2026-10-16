import contactService from '../services/contact.service.js';
import { success } from '../utils/response.util.js';

class ContactController {
  async create(req, res, next) {
    try {
      const contact = await contactService.createContact(req.user.tenantId, req.body);
      return success(res, 'Thêm mới khách hàng thành công.', contact, 201);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await contactService.getContacts(req.user.tenantId, req.query);
      return success(res, 'Lấy danh sách khách hàng thành công.', result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const contact = await contactService.getContactById(req.params.id, req.user.tenantId);
      return success(res, 'Lấy thông tin khách hàng thành công.', contact);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const contact = await contactService.updateContact(req.params.id, req.user.tenantId, req.body);
      return success(res, 'Cập nhật thông tin khách hàng thành công.', contact);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await contactService.deleteContact(req.params.id, req.user.tenantId);
      return success(res, 'Xóa khách hàng thành công.');
    } catch (error) {
      next(error);
    }
  }

  async import(req, res, next) {
    try {
      const { contacts } = req.body;
      const result = await contactService.importContacts(req.user.tenantId, contacts);
      return success(res, 'Import danh sách khách hàng thành công.', result);
    } catch (error) {
      next(error);
    }
  }

  async unsubscribe(req, res, next) {
    try {
      const { email, tenantId } = req.query;
      await contactService.unsubscribeContact(email, tenantId);

      // Trả về giao diện HTML phản hồi trực tiếp cho người dùng
      return res.status(200).send(`
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f9fafb; min-height: 100vh;">
          <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #10b981; margin-bottom: 10px;">✅ Hủy đăng ký thành công</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Địa chỉ email <strong>${email || ''}</strong> đã được xóa khỏi danh sách nhận tin tự động của Workspace này.
            </p>
            <p style="color: #9ca3af; font-size: 13px; margin-top: 20px;">Cảm ơn bạn đã sử dụng dịch vụ của VERDIO.</p>
          </div>
        </div>
      `);
    } catch (error) {
      next(error);
    }
  }
}

export default new ContactController();