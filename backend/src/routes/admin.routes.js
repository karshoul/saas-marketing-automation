import { Router } from 'express';
import adminController from '../controllers/admin.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requireSuperAdmin } from '../middleware/admin.middleware.js';

const router = Router();

// Toàn bộ route quản trị đều đi qua 2 lớp bảo vệ nghiêm ngặt
router.use(authenticateUser);
router.use(requireSuperAdmin);

// Quản lý Tenants
router.get('/tenants', adminController.getTenants);
router.put('/tenants/:tenantId/status', adminController.updateStatus);
router.put('/tenants/:tenantId/plan', adminController.updatePlan);

// Benchmark Engine (Ablation Study)
router.post('/benchmark/run', adminController.triggerBenchmark);

export default router;