import express from 'express';
import Contact from '../models/Contact.js';
import protect from '../middleware/authMiddleware.js'; // 🔥 THÊM DÒNG NÀY

const router = express.Router();

// 1. API THÊM MỚI KHÁCH HÀNG (Đã được bảo mật bằng protect)
// POST: http://localhost:5000/api/contacts
router.post('/', protect, async (req, res) => {
  try {
    const { name, email, tags } = req.body;
    
    // 🔥 Lấy tenantId tự động do Middleware gác cửa giải mã và đính vào, không cần nhập tay!
    const tenantId = req.tenantId; 

    const newContact = new Contact({
      tenantId,
      name,
      email,
      tags
    });

    await newContact.save();

    res.status(201).json({
      status: 'Success',
      message: 'Thêm khách hàng vào shop bảo mật thành công!',
      data: newContact
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ status: 'Fail', message: 'Email này đã tồn tại trong hệ thống của shop!' });
    }
    res.status(500).json({ status: 'Error', message: error.message });
  }
});

// 2. API LẤY DANH SÁCH KHÁCH HÀNG (Tự động lọc đúng Shop của người đang đăng nhập)
// GET: http://localhost:5000/api/contacts
router.get('/', protect, async (req, res) => {
  try {
    // 🔥 Tự động lấy ID shop từ token của người đang đăng nhập
    const tenantId = req.tenantId; 

    const contacts = await Contact.find({ tenantId });

    res.status(200).json({
      status: 'Success',
      total: contacts.length,
      data: contacts
    });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: error.message });
  }
});

export default router;