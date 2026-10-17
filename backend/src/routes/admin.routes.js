import { Router } from 'express';
import adminController from '../controllers/admin.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requireSuperAdmin } from '../middleware/admin.middleware.js';

const router = Router();

// Lớp bảo vệ xác thực SuperAdmin
router.use(authenticateUser);
router.use(requireSuperAdmin);

// Quản lý Tenants
router.get('/tenants', adminController.getTenants);

router.put('/tenants/:tenantId/status', adminController.updateStatus);
router.patch('/tenants/:tenantId/status', adminController.updateStatus);

router.put('/tenants/:tenantId/plan', adminController.updatePlan);
router.patch('/tenants/:tenantId/plan', adminController.updatePlan);

// Xóa Workspace
router.delete('/tenants/:tenantId', adminController.deleteTenant);

// Test gửi OTP khẩn cấp (Priority Queue)
router.post('/send-otp', adminController.sendOtpEmail);

// Giám sát Hạ Tầng Queue & Worker Realtime
if (adminController.getQueueStatus) {
  router.get('/queue-status', adminController.getQueueStatus);
}

// Benchmark Engine
router.post('/benchmark/run', adminController.triggerBenchmark);

export default router;