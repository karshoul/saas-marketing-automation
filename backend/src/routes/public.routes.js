import { Router } from 'express';
import contactService from '../services/contact.service.js';
import Tenant from '../models/Tenant.js';
import ApiError from '../utils/apiError.util.js';

const router = Router();

/**
 * 🔓 API Công khai thu thập Contact từ Form bên ngoài
 * Endpoint: POST /api/v1/public/contacts
 */
router.post('/contacts', async (req, res, next) => {
  try {
    const { tenantId, email, firstName, lastName, company, tags } = req.body;

    if (!tenantId) {
      throw new ApiError(400, 'Thiếu thông tin ID Workspace (tenantId).');
    }

    if (!email) {
      throw new ApiError(400, 'Địa chỉ email là bắt buộc.');
    }

    // 1. Kiểm tra Workspace có tồn tại không
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new ApiError(404, 'Workspace không tồn tại trên hệ thống Verdio.');
    }

    // 2. Tạo Contact mới (Hàm createContact đã tích hợp sẵn trigger kịch bản tự động)
    const newContact = await contactService.createContact(tenant._id, {
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      company: company || '',
      tags: Array.isArray(tags) && tags.length > 0 ? tags : ['WebForm_Lead']
    });

    return res.status(201).json({
      success: true,
      message: 'Đăng ký thông tin thành công!',
      data: {
        id: newContact._id,
        email: newContact.email
      }
    });
  } catch (error) {
    // Tránh văng lỗi 409 khi email đã tồn tại trong danh bạ
    if (error.statusCode === 409) {
      return res.status(200).json({
        success: true,
        message: 'Email này đã có trong danh sách đăng ký của chúng tôi.'
      });
    }
    next(error);
  }
});

export default router;