import { Router } from 'express';
import cors from 'cors';
import contactService from '../services/contact.service.js';
import Tenant from '../models/Tenant.js';
import ApiError from '../utils/apiError.util.js';
import { publicContactLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// 🔓 Bật CORS (*): Cho phép tất cả tên miền trang web bên ngoài nhúng Widget
router.use(cors({ origin: '*' }));

/**
 * 🔓 API phát hành Mã nhúng Script Widget (Public Widget Script)
 * Endpoint: GET /api/v1/public/verdio.js
 */
router.get('/verdio.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  
  const jsContent = `
(function() {
  // 1. Tự động đọc data-tenant-id từ thẻ script nhúng
  const currentScript = document.currentScript || document.querySelector('script[data-tenant-id]');
  if (!currentScript) return;
  
  const tenantId = currentScript.getAttribute('data-tenant-id');
  const backendUrl = currentScript.getAttribute('data-backend-url') || 'http://localhost:5000';

  if (!tenantId) {
    console.error('[VERDIO SaaS] Lỗi: Thiếu data-tenant-id trong mã nhúng!');
    return;
  }

  // 2. Tự động bơm Nút bấm Widget (Floating Button) vào góc dưới bên phải trang web
  const btn = document.createElement('div');
  btn.id = 'verdio-widget-btn';
  btn.innerHTML = '🎁 <span style="font-size:14px;font-weight:bold;margin-left:6px;">Nhận Voucher -20%</span>';
  btn.style.cssText = \`
    position: fixed; bottom: 24px; right: 24px; z-index: 999999;
    background: #2563eb; color: white; padding: 12px 20px; border-radius: 50px;
    box-shadow: 0 10px 25px -5px rgba(37,99,235,0.5); cursor: pointer;
    font-family: Arial, sans-serif; display: flex; align-items: center;
    transition: transform 0.2s ease;
  \`;
  
  btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
  btn.onmouseout = () => btn.style.transform = 'scale(1)';

  // 3. Tự động tạo Pop-up Modal điền thông tin
  const modal = document.createElement('div');
  modal.id = 'verdio-widget-modal';
  modal.style.cssText = \`
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(4px);
    z-index: 1000000; display: none; justify-content: center; align-items: center;
    font-family: Arial, sans-serif;
  \`;

  modal.innerHTML = \`
    <div style="background: #0f172a; color: white; border: 1px solid #334155; padding: 32px; border-radius: 20px; width: 90%; max-width: 400px; position: relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); text-align: center;">
      <span id="verdio-close-btn" style="position: absolute; top: 16px; right: 20px; cursor: pointer; color: #94a3b8; font-size: 22px; font-weight: bold;">&times;</span>
      
      <div style="font-size: 40px; margin-bottom: 8px;">🎁</div>
      <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: bold; color: #fff;">Ưu Đãi Độc Quyền</h3>
      <p style="margin: 0 0 20px 0; font-size: 13px; color: #94a3b8;">Nhập Email để nhận ngay mã giảm giá 20% gửi trực tiếp vào hòm thư!</p>

      <form id="verdio-modal-form">
        <input type="text" id="verdio-modal-name" placeholder="Họ và tên của bạn..." required style="width: 100%; padding: 12px; margin-bottom: 12px; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: white; box-sizing: border-box; font-size: 14px; outline: none;" />
        <input type="email" id="verdio-modal-email" placeholder="Địa chỉ Email..." required style="width: 100%; padding: 12px; margin-bottom: 16px; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: white; box-sizing: border-box; font-size: 14px; outline: none;" />
        <button type="submit" id="verdio-modal-submit" style="width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">NHẬN VOUCHER NGAY</button>
      </form>
      <div id="verdio-modal-msg" style="margin-top: 12px; font-size: 13px; font-weight: bold; display: none;"></div>
    </div>
  \`;

  document.body.appendChild(btn);
  document.body.appendChild(modal);

  btn.onclick = () => modal.style.display = 'flex';
  document.getElementById('verdio-close-btn').onclick = () => modal.style.display = 'none';

  // Xử lý gửi dữ liệu về VERDIO SaaS Engine
  document.getElementById('verdio-modal-form').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('verdio-modal-submit');
    const msgDiv = document.getElementById('verdio-modal-msg');
    const name = document.getElementById('verdio-modal-name').value;
    const email = document.getElementById('verdio-modal-email').value;

    submitBtn.disabled = true;
    submitBtn.innerText = 'Đang xử lý...';
    msgDiv.style.display = 'none';

    try {
      const res = await fetch(backendUrl + '/api/v1/public/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, email, firstName: name, tags: ['Embed_Widget_Lead'] })
      });
      const data = await res.json();
      
      msgDiv.style.display = 'block';
      if (res.ok) {
        msgDiv.style.color = '#34d399';
        msgDiv.innerText = '🎉 ' + data.message;
        setTimeout(() => { modal.style.display = 'none'; }, 2000);
      } else {
        msgDiv.style.color = '#f87171';
        msgDiv.innerText = '❌ ' + (data.message || 'Lỗi đăng ký.');
      }
    } catch(err) {
      msgDiv.style.display = 'block';
      msgDiv.style.color = '#f87171';
      msgDiv.innerText = '❌ Không thể kết nối tới máy chủ VERDIO!';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'NHẬN VOUCHER NGAY';
    }
  };
})();
  `;

  res.send(jsContent);
});

/**
 * 🔓 API Công khai thu thập Contact từ Form / Webhook bên ngoài
 * Endpoint: POST /api/v1/public/contacts
 */
router.post('/contacts', publicContactLimiter, async (req, res, next) => {
  try {
    const { tenantId, email, firstName, lastName, company, tags } = req.body;

    if (!tenantId) {
      throw new ApiError(400, 'Thiếu thông tin ID Workspace (tenantId).');
    }

    if (!email) {
      throw new ApiError(400, 'Địa chỉ email là bắt buộc.');
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new ApiError(404, 'Workspace không tồn tại trên hệ thống Verdio.');
    }

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