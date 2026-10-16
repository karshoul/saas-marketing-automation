import { Router } from 'express';
import tenantController from '../controllers/tenant.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticateUser);

router.get('/me', tenantController.getMyTenant);
router.put('/me', authorizeRoles('OWNER'), tenantController.updateMyTenant);
router.get('/my-workspaces', tenantController.getMyWorkspaces);
router.post('/regenerate-api-key', authorizeRoles('OWNER'), tenantController.regenerateApiKey);
router.put('/smtp', authorizeRoles('OWNER'), tenantController.updateTenantSmtp);
// Thêm route test SMTP
router.post(
  '/smtp/test',
  authorizeRoles('OWNER'),
  tenantController.testSmtpConnection
);

export default router;