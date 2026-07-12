import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Tenant from '../models/Tenant.js';
import Subscription from '../models/Subscription.js';

const router = express.Router();

// 1. API ĐĂNG KÝ DOANH NGHIỆP MỚI (Có mã hóa mật khẩu)
// POST: http://localhost:5000/api/tenants/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Kiểm tra xem email shop đã được đăng ký chưa
    const existTenant = await Tenant.findOne({ email });
    if (existTenant) {
      return res.status(400).json({ status: 'Fail', message: 'Email doanh nghiệp này đã tồn tại!' });
    }

    // Tiến hành mã hóa mật khẩu (Salt 10 vòng)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Lưu doanh nghiệp với mật khẩu đã mã hóa
    const newTenant = new Tenant({
      name,
      email,
      password: hashedPassword
    });
    await newTenant.save();

    // Tự động kích hoạt gói Starter dùng thử 30 ngày
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);
    const newSubscription = new Subscription({
      tenantId: newTenant._id,
      packageType: 'Starter',
      status: 'Active',
      endDate: expirationDate
    });
    await newSubscription.save();

    res.status(201).json({
      status: 'Success',
      message: 'Đăng ký tài khoản doanh nghiệp thành công!',
      tenantId: newTenant._id
    });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: error.message });
  }
});

// 2. API ĐĂNG NHẬP DOANH NGHIỆP (Cấp thẻ bài JWT Token)
// POST: http://localhost:5000/api/tenants/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Tìm xem có tồn tại email shop này không
    const tenant = await Tenant.findOne({ email });
    if (!tenant) {
      return res.status(400).json({ status: 'Fail', message: 'Email hoặc mật khẩu không chính xác!' });
    }

    // So sánh mật khẩu người dùng nhập với mật khẩu đã mã hóa trong DB
    const isMatch = await bcrypt.compare(password, tenant.password);
    if (!isMatch) {
      return res.status(400).json({ status: 'Fail', message: 'Email hoặc mật khẩu không chính xác!' });
    }

    // Nếu khớp mật khẩu, tiến hành tạo chuỗi Token JWT chứa mã ID của Shop
    const token = jwt.sign(
      { tenantId: tenant._id, name: tenant.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Thẻ bài có hiệu lực trong 7 ngày
    );

    res.status(200).json({
      status: 'Success',
      message: 'Đăng nhập thành công!',
      token: token // Frontend sẽ nhận chuỗi này để lưu lại
    });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: error.message });
  }
});

export default router;