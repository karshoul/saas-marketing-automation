import express from 'express';
import campaignController from '../controllers/campaign.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { checkCampaignQuota, checkFeatureAccess } from '../middleware/quota.middleware.js';

const router = express.Router();

// =======================================================
// 🌐 1. PUBLIC TRACKING ROUTES
// =======================================================
router.get('/track/open', campaignController.trackOpen);
router.get('/track/click', campaignController.trackClick);

// =======================================================
// 🔒 2. PROTECTED SAAS ROUTES
// =======================================================
router.use(authenticateUser);

router.get('/', campaignController.getAll);
router.post(
  '/',
  authorizeRoles('OWNER', 'ADMIN'),
  checkFeatureAccess('HIGH_PRIORITY_SLA'),
  campaignController.create
);
router.get('/:id', campaignController.getById);

// Gác cổng Quota trước khi đưa email vào BullMQ
router.post(
  '/:id/trigger',
  authorizeRoles('OWNER', 'ADMIN'),
  checkCampaignQuota, // <--- Chặn nếu vượt hạn mức tháng
  campaignController.trigger
);

router.get('/:id/queue-status', campaignController.getQueueStatus);

export default router;