import authService from '../services/auth.service.js';
import { success, created } from '../utils/response.util.js';
import { TOKEN_EXPIRY } from '../constants/auth/tokens.js';

// Cấu hình cookie an toàn cấp độ Enterprise chống CSRF
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // Chỉ gửi qua HTTPS ở môi trường Live
  sameSite: 'strict', // Ngăn chặn tấn công Cross-Site Request Forgery
  maxAge: TOKEN_EXPIRY.REFRESH
};

class AuthController {
  
  /**
   * Đăng ký hệ thống chuỗi SaaS Multi-Tenant
   */
  async register(req, res, next) {
    try {
      const context = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        ua: req.headers['user-agent'] || 'Unknown Agent',
        fingerprint: req.headers['x-device-fingerprint'] || 'default_fingerprint'
      };

      // 1. Chuyển giao toàn bộ tham số cho AuthService
      const { user, tenant, accessToken, refreshToken } = await authService.register(req.body, context);

      // 2. Ghim Refresh Token vào HttpOnly Cookie bảo mật
      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

      // 3. Trả phản hồi thành công chuẩn 201 Created
      return created(res, 'Đăng ký tài khoản Workspace thành công. Vui lòng kiểm tra hộp thư để kích hoạt.', {
        user,
        tenant,
        accessToken
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Đăng nhập hệ thống (Xử lý đa thiết bị & Ghim Session Cookie)
   */
  async login(req, res, next) {
    try {
      const context = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        ua: req.headers['user-agent'] || 'Unknown Agent'
      };

      const loginPayload = {
        ...req.body,
        deviceInfo: req.headers['user-agent'] || 'Unknown Device',
        fingerprint: req.headers['x-device-fingerprint'] || 'default_fingerprint'
      };

      const { user, accessToken, refreshToken } = await authService.login(loginPayload, context);

      // Cài đặt Refresh Token trực tiếp vào HttpOnly Cookie bảo mật
      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

      return success(res, 'Đăng nhập thành công.', {
        user,
        accessToken
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vòng quay cấp mới mã truy cập ngắn hạn (Silent Refresh Token)
   */
  async refreshTokens(req, res, next) {
    try {
      // 1. Đọc Refresh Token từ HttpOnly Cookie (hoặc từ Request Body làm phương án Fallback)
      const plainRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      const context = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        ua: req.headers['user-agent'] || 'Unknown Agent'
      };

      // 2. Gọi AuthService thực thi xoay vòng Refresh Token
      const { accessToken, refreshToken: newRefreshToken } = await authService.refreshAccessToken(
        plainRefreshToken,
        context
      );

      // 3. Đặt lại HttpOnly Cookie mới đè lên Cookie cũ ở Client
      res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

      // 4. Trả về Access Token mới cho Frontend App
      return success(res, 'Gia hạn phiên làm việc thành công.', {
        accessToken
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Đăng xuất hệ thống (Giải phóng Cookie & Thu hồi Token trong DB)
   */
  async logout(req, res, next) {
    try {
      // 1. Trích xuất Refresh Token từ Cookie hoặc Header
      const plainRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      // 2. Lấy userId và tenantId được Middleware authenticateUser tiêm vào req.user
      const userId = req.user.id;
      const tenantId = req.user.tenantId;

      const context = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        ua: req.headers['user-agent'] || 'Unknown Agent'
      };

      // 3. Gọi Service thu hồi Session và ghi AuditLog
      await authService.logout(userId, tenantId, plainRefreshToken, context);

      // 4. Xóa Refresh Token Cookie phía Client
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      return success(res, 'Đăng xuất tài khoản thành công.');
    } catch (error) {
      next(error);
    }
  }

  async logoutAllDevices(req, res, next) {
    try {
      const userId = req.user.id;
      const tenantId = req.user.tenantId;

      const context = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        ua: req.headers['user-agent'] || 'Unknown Agent'
      };

      // 1. Gọi Service thực thi thu hồi toàn bộ phiên
      const { revokedSessionsCount } = await authService.logoutAllDevices(userId, tenantId, context);

      // 2. Dọn dẹp Cookie ở Client thiết bị hiện tại
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      return success(res, 'Đăng xuất thành công khỏi tất cả các thiết bị.', {
        revokedSessionsCount
      });
    } catch (error) {
      next(error);
    }
  }

  /**
 * Xác thực hòm thư điện tử qua Token từ Query String
 * Hỗ trợ cả kích hoạt trực tiếp trên Trình duyệt (GET) lẫn gọi API từ Frontend/Postman (POST)
 */
async verifyEmail(req, res, next) {
  try {
    // Trích xuất token từ URL Query string: /api/auth/verify-email?token=xyz...
    const { token } = req.query;

    const context = {
      ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      ua: req.headers['user-agent'] || 'Unknown Agent'
    };

    // Thực thi băm SHA-256 đối soát DB và cập nhật isVerified = true
    await authService.verifyEmail(token, context);

    // Nếu người dùng click trực tiếp vào link trong Gmail (Request method GET từ Trình duyệt)
    if (req.method === 'GET') {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Kích Hoạt Tài Khoản Thành Công - VERDIO</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            .card { background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; max-width: 480px; width: 90%; }
            .icon { font-size: 56px; margin-bottom: 16px; display: inline-block; }
            h1 { color: #16a34a; margin-bottom: 12px; font-size: 24px; font-weight: 700; }
            p { color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
            .btn { display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; transition: background-color 0.2s; }
            .btn:hover { background-color: #1d4ed8; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">🎉</div>
            <h1>Kích Hoạt Tài Khoản Thành Công!</h1>
            <p>Tài khoản Workspace VERDIO của bạn đã sẵn sàng. Bạn có thể đóng tab này và tiến hành đăng nhập vào hệ thống.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="btn">Đăng Nhập Ngay</a>
          </div>
        </body>
        </html>
      `);
    }

    // Trả về JSON cho API Postman / Single Page App (POST Request)
    return success(res, 'Xác thực hòm thư điện tử thành công. Tài khoản của bạn đã được kích hoạt hoàn toàn.');
  } catch (error) {
    next(error);
  }
}

  /**
   * Gửi yêu cầu khôi phục mật khẩu khi quên
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const context = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        ua: req.headers['user-agent'] || 'Unknown Agent'
      };

      await authService.forgotPassword(email, context);

      // Phản hồi thành công nhất quán ngay cả khi email không tồn tại (Anti-Enumeration Protection)
      return success(
        res,
        'Nếu địa chỉ email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn khôi phục mật khẩu vào hòm thư của bạn.'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Thiết lập mật khẩu mới thông qua token xác nhận
   */
  async resetPassword(req, res, next) {
    try {
      // Trích xuất plain token từ Query String: /api/auth/reset-password?token=xyz...
      const { token } = req.query;
      const { password } = req.body;

      const context = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        ua: req.headers['user-agent'] || 'Unknown Agent'
      };

      await authService.resetPassword(token, password, context);

      // Dọn dẹp Refresh Token Cookie trên thiết bị hiện tại (nếu có)
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      return success(
        res,
        'Đặt lại mật khẩu mới thành công. Toàn bộ phiên đăng nhập cũ đã được vô hiệu hóa để bảo mật tài khoản.'
      );
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
  try {
    // req.user được gán từ authMiddleware ({ id, tenantId, role })
    const { id, tenantId } = req.user;

    // Lấy thông tin user & tenant chi tiết từ Service
    const currentUser = await authService.getCurrentUser(id, tenantId);

    return success(res, 'Lấy thông tin tài khoản thành công.', currentUser);
  } catch (error) {
    next(error);
  }
}
}

export default new AuthController();