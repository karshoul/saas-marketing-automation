import express from 'express';
import campaignController from '../controllers/campaign.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { checkCampaignQuota } from '../middleware/quota.middleware.js';

const router = express.Router();

// Public Tracking
router.get('/track/open', campaignController.trackOpen);
router.get('/track/click', campaignController.trackClick);

// Protected Routes
router.use(authenticateUser);

router.get('/', campaignController.getAll);
router.get('/:id', campaignController.getById);

// 🛡️ Cho phép mọi gói cước tạo chiến dịch (chỉ phân quyền OWNER / ADMIN)
router.post(
  '/',
  authorizeRoles('OWNER', 'ADMIN'),
  campaignController.create
);

// Route cập nhật và xóa chiến dịch
router.put('/:id', authorizeRoles('OWNER', 'ADMIN'), campaignController.update);
router.delete('/:id', authorizeRoles('OWNER', 'ADMIN'), campaignController.delete);

// Kiểm tra Quota tháng trước khi bơm Job vào BullMQ
router.post(
  '/:id/trigger',
  authorizeRoles('OWNER', 'ADMIN'),
  checkCampaignQuota,
  campaignController.trigger
);

router.get('/:id/queue-status', campaignController.getQueueStatus);

export default router;