import { Router } from 'express';
import aiController from '../controllers/ai.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateUser);

router.post('/suggest-subject', (req, res, next) => aiController.suggestSubjects(req, res, next));
router.post('/generate-template', (req, res, next) => aiController.generateEmailTemplate(req, res, next));

export default router;