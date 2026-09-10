import { Router } from 'express';
import templateController from '../controllers/template.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = Router();
router.use(authenticateUser);

router.get('/', templateController.getAll);
router.post('/', authorizeRoles('OWNER', 'ADMIN', 'MEMBER'), templateController.create);
router.put('/:id', authorizeRoles('OWNER', 'ADMIN', 'MEMBER'), templateController.update);
router.delete('/:id', authorizeRoles('OWNER', 'ADMIN'), templateController.delete);

export default router;