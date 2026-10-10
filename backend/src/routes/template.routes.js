import { Router } from 'express';
import templateController from '../controllers/template.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticateUser);

router.get('/', templateController.getAll);
router.get('/:id', templateController.getById);

router.post('/', authorizeRoles('OWNER', 'ADMIN', 'MEMBER'), templateController.create);
router.put('/:id', authorizeRoles('OWNER', 'ADMIN', 'MEMBER'), templateController.update);
router.delete('/:id', authorizeRoles('OWNER', 'ADMIN'), templateController.delete);
router.post('/:id/clone', authorizeRoles('OWNER', 'ADMIN', 'MEMBER'), templateController.clone);

export default router;