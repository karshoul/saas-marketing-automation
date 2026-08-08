import express from 'express';
import { getCampaigns, createCampaign, sendCampaign } from '../controllers/campaignController.js';
import protect from '../middleware/authMiddleware.js'; // Nhập middleware protect của Khương

const router = express.Router();

router.get('/', protect, getCampaigns);
router.post('/', protect, createCampaign);
router.post('/:campaignId/send', protect, sendCampaign); // Kích hoạt gửi mail ngầm

export default router;