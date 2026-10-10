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
 */
router.post(
  '/register',
  authRateLimiter,
  validateDto(registerValidator),
  authController.register
);

/**
 * @route   POST /api/auth/login
 */
router.post(
  '/login',
  authRateLimiter,
  validateDto(loginValidator),
  authController.login
);

/**
 * @route   POST /api/auth/google
 * @desc    Đăng nhập hoặc đăng ký bằng Google OAuth
 */
router.post(
  '/google',
  authRateLimiter,
  authController.googleLogin
);

/**
 * @route   POST /api/auth/refresh-token
 */
router.post(
  '/refresh-token',
  authController.refreshTokens
);

/**
 * @route   POST /api/auth/logout
 */
router.post(
  '/logout',
  authenticateUser,
  authController.logout
);

/**
 * @route   POST /api/auth/logout-all
 */
router.post(
  '/logout-all',
  authenticateUser,
  authController.logoutAllDevices
);

/**
 * @route   POST /api/auth/verify-email
 */
router.get('/verify-email', authController.verifyEmail);
router.post('/verify-email', authController.verifyEmail);

/**
 * @route   GET /api/auth/me
 */
router.get('/me', authenticateUser, authController.getMe);

/**
 * @route   POST /api/auth/forgot-password
 */
router.post(
  '/forgot-password',
  authRateLimiter,
  validateDto(forgotPasswordValidator),
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 */
router.post(
  '/reset-password',
  authRateLimiter,
  validateDto(resetPasswordValidator),
  authController.resetPassword
);

export default router;