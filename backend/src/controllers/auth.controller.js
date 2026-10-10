import authService from '../services/auth.service.js';
import { success, created } from '../utils/response.util.js';
import { TOKEN_EXPIRY } from '../constants/auth/tokens.js';

// Cấu hình cookie an toàn cấp độ Enterprise chống CSRF
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: TOKEN_EXPIRY.REFRESH
};

class AuthController {
  
  /**
   * Đăng ký hệ thống chuỗi SaaS Multi-Tenant (Kích hoạt luôn)
   */
  async register(req, res, next) {
    try {
      const context = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        ua: req.headers['user-agent'] || 'Unknown Agent',
        fingerprint: req.headers['x-device-fingerprint'] || 'default_fingerprint'
      };

      const { user, tenant, accessToken, refreshToken } = await authService.register(req.body, context);

      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

      return created(res, 'Đăng ký tài khoản Workspace thành công.', {
        user,
        tenant,
        accessToken
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Đăng nhập hệ thống (Email + Password)
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

      const { user, tenant, accessToken, refreshToken } = await authService.login(loginPayload, context);

      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

      return success(res, 'Đăng nhập thành công.', {
        user,
        workspace: tenant,
        accessToken
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Đăng nhập / Đăng ký qua Google OAuth
   */
  async googleLogin(req, res, next) {
    try {
      const { credential } = req.body;
      const context = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        ua: req.headers['user-agent'] || 'Unknown Agent',
        fingerprint: req.headers['x-device-fingerprint'] || 'google_auth_fingerprint'
      };

      const { user, tenant, accessToken, refreshToken } = await authService.loginWithGoogle(credential, context);

      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

      return success(res, 'Đăng nhập Google thành công.', {
        user,
        workspace: tenant,
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
      const plainRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      const context = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        ua: req.headers['user-agent'] || 'Unknown Agent'
      };

      const { accessToken, refreshToken: newRefreshToken } = await authService.refreshAccessToken(
        plainRefreshToken,
        context
      );

      res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

      return success(res, 'Gia hạn phiên làm việc thành công.', {
        accessToken
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Đăng xuất hệ thống
   */
  async logout(req, res, next) {
    try {
      const plainRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      const userId = req.user.id;
      const tenantId = req.user.tenantId;

      const context = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        ua: req.headers['user-agent'] || 'Unknown Agent'
      };

      await authService.logout(userId, tenantId, plainRefreshToken, context);

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

      const { revokedSessionsCount } = await authService.logoutAllDevices(userId, tenantId, context);

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

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;

      const context = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        ua: req.headers['user-agent'] || 'Unknown Agent'
      };

      await authService.verifyEmail(token, context);

      if (req.method === 'GET') {
        return res.status(200).send(`
          <!DOCTYPE html>
          <html lang="vi">
          <head>
            <meta charset="UTF-8">
            <title>Kích Hoạt Tài Khoản - VERDIO</title>
          </head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>🎉 Tài khoản đã được kích hoạt!</h1>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login">Về trang đăng nhập</a>
          </body>
          </html>
        `);
      }

      return success(res, 'Xác thực hòm thư điện tử thành công.');
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const context = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        ua: req.headers['user-agent'] || 'Unknown Agent'
      };

      await authService.forgotPassword(email, context);

      return success(
        res,
        'Nếu địa chỉ email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn khôi phục mật khẩu vào hòm thư của bạn.'
      );
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      // Nhận token từ cả query url hoặc body
      const token = req.body?.token || req.query?.token;
      const { password } = req.body;

      const context = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        ua: req.headers['user-agent'] || 'Unknown Agent'
      };

      await authService.resetPassword(token, password, context);

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      return success(res, 'Đặt lại mật khẩu mới thành công.');
    } catch (error) {
      next(error);
    }
  }
  async getMe(req, res, next) {
    try {
      const { id, tenantId } = req.user;
      const currentUser = await authService.getCurrentUser(id, tenantId);
      return success(res, 'Lấy thông tin tài khoản thành công.', currentUser);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();