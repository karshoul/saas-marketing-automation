import { Router } from 'express';
import aiController from '../controllers/ai.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateUser);

router.post('/suggest-subject', aiController.suggestSubjects);
router.post('/generate-template', aiController.generateEmailTemplate);

export default router;