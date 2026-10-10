import { Router } from 'express';

// Controller
import tenantController from '../controllers/tenant.controller.js';

// Middleware
import { authenticateUser } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// Áp dụng middleware xác thực cho tất cả route bên dưới
router.use(authenticateUser);

/**
 * @route   GET /api/tenants/me
 * @desc    Lấy thông tin chi tiết Workspace của Tenant hiện tại (Mọi role đều xem được)
 */
router.get('/me', tenantController.getMyTenant);

/**
 * @route   PUT /api/tenants/me
 * @desc    Cập nhật thông tin cấu hình Workspace (Độc quyền OWNER)
 */
router.put(
  '/me',
  authorizeRoles('OWNER'),
  tenantController.updateMyTenant
);

/**
 * @route   GET /api/tenants/my-workspaces
 * @desc    Lấy danh sách các Workspace mà user đang tham gia
 */
router.get('/my-workspaces', tenantController.getMyWorkspaces);

/**
 * @route   POST /api/tenants/regenerate-api-key
 * @desc    Tạo mới / Xoay vòng Khóa API (Live API Key) cho Workspace (Độc quyền OWNER)
 */
router.post(
  '/regenerate-api-key',
  authorizeRoles('OWNER'),
  tenantController.regenerateApiKey
);

/**
 * @route   PUT /api/tenants/smtp
 * @desc    Cập nhật cấu hình cổng gửi thư SMTP riêng cho Workspace (Độc quyền OWNER)
 */
router.put(
  '/smtp',
  authorizeRoles('OWNER'),
  tenantController.updateTenantSmtp
);

export default router;