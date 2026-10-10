import { Router } from 'express';
import automationController from '../controllers/automation.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticateUser);

router.get('/', automationController.getAll);
router.get('/:id', automationController.getById);

router.post('/', authorizeRoles('OWNER', 'ADMIN'), automationController.create);
router.put('/:id', authorizeRoles('OWNER', 'ADMIN'), automationController.update);
router.patch('/:id/toggle-status', authorizeRoles('OWNER', 'ADMIN'), automationController.toggleStatus);
router.delete('/:id', authorizeRoles('OWNER', 'ADMIN'), automationController.delete);

export default router;