import { Router } from 'express';

// Controllers
import tenantController from '../controllers/tenant.controller.js';

// Middlewares
import { authenticateUser } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { validateDto } from '../middlewares/validate.middleware.js';

// Validators
import { createTenantValidator } from '../validators/tenant.validator.js';

// Constants
import { ROLES } from '../constants/auth/roles.js';

const router = Router();

// Toàn bộ các API thuộc Tenant Domain bắt buộc phải đi qua lớp Kiểm tra Access Token
router.use(authenticateUser);

/**
 * @route   GET /api/tenants/me
 * @desc    Lấy thông tin chi tiết Workspace của Tenant hiện tại
 * @access  Private (Mọi nhân viên thuộc Tenant đều xem được)
 */
router.get(
  '/me',
  tenantController.getMyTenant
);

/**
 * @route   PUT /api/tenants/me
 * @desc    Cập nhật thông tin cấu hình Workspace (Tên, cấu hình)
 * @access  Private (Chỉ OWNER và ADMIN mới có quyền chỉnh sửa)
 */
router.put(
  '/me',
  authorizeRoles(ROLES.OWNER, ROLES.ADMIN),
  validateDto(createTenantValidator),
  tenantController.updateMyTenant
);

export default router;