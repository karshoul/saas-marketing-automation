import { Router } from 'express';

// Controller
import tenantController from '../controllers/tenant.controller.js';

// Sửa 'middlewares' thành 'middleware' (bỏ chữ s)
import { authenticateUser } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// Áp dụng middleware xác thực
router.use(authenticateUser);

/**
 * @route   GET /api/tenants/me
 * @desc    Lấy thông tin chi tiết Workspace của Tenant hiện tại
 */
router.get('/me', tenantController.getMyTenant);

/**
 * @route   PUT /api/tenants/me
 * @desc    Cập nhật thông tin cấu hình Workspace
 */
router.put(
  '/me',
  authorizeRoles('OWNER', 'ADMIN'),
  tenantController.updateMyTenant
);

export default router;