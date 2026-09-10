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
}

export default new ContactController();