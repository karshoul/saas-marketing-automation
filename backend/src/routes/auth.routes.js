import { Router } from 'express';

// Controllers
import authController from '../controllers/auth.controller.js';

// Middlewares
import { validateDto } from '../middleware/validate.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

// Validators
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator
} from '../validators/auth.validator.js';



const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký tài khoản Workspace Multi-Tenant mới
 * @access  Public
 */
router.post(
  '/register',
  authRateLimiter,
  validateDto(registerValidator),
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Đăng nhập hệ thống & cấp Access Token + HttpOnly Refresh Cookie
 * @access  Public
 */
router.post(
  '/login',
  authRateLimiter,
  validateDto(loginValidator),
  authController.login
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Gia hạn Access Token mới bằng HttpOnly Refresh Token Cookie (Kèm Refresh Token Rotation)
 * @access  Public (Không cần gửi Bearer Token ở Header)
 */
router.post(
  '/refresh-token',
  authController.refreshTokens
);

/**
 * @route   POST /api/auth/logout
 * @desc    Đăng xuất thiết bị hiện tại (Revoke Session + Clear HttpOnly Cookie)
 * @access  Private (Bắt buộc phải đi qua authenticateUser Middleware)
 */
router.post(
  '/logout',
  authenticateUser,
  authController.logout
);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Đăng xuất khỏi tất cả các thiết bị (Revoke ALL Active Sessions by UserId)
 * @access  Private (Bắt buộc phải đi qua authenticateUser Middleware)
 */
router.post(
  '/logout-all',
  authenticateUser,
  authController.logoutAllDevices
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Xác thực hòm thư điện tử bằng Query Token
 * @access  Public
 */
router.get('/verify-email', authController.verifyEmail);

router.post(
  '/verify-email',
  authController.verifyEmail
)

/**
 * @route   GET /api/auth/me
 * @desc    Lấy thông tin tài khoản & Workspace đang đăng nhập
 * @access  Private (Cần Bearer Token)
 */
router.get('/me', authenticateUser, authController.getMe);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Gửi yêu cầu khôi phục mật khẩu qua Email (Anti-Enumeration Protected)
 * @access  Public
 */
router.post(
  '/forgot-password',
  authRateLimiter,
  validateDto(forgotPasswordValidator),
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Đặt lại mật khẩu mới thông qua Reset Token (Gửi qua Query parameter)
 * @access  Public
 */
router.post(
  '/reset-password',
  authRateLimiter,
  validateDto(resetPasswordValidator),
  authController.resetPassword
);

export default router;