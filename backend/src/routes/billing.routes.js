import { Router } from 'express';
import billingController from '../controllers/billing.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

// Endpoint công khai lấy bảng giá
router.get('/plans', billingController.getPlans);

// Các endpoint nghiệp vụ thanh toán (Yêu cầu đăng nhập)
router.use(authenticateUser);

router.post('/subscribe', authorizeRoles('OWNER', 'ADMIN'), billingController.subscribe);
router.get('/order/:orderId', billingController.checkOrder);

// Cho phép xác nhận thanh toán (Dùng cho cả Webhook và Nút test demo khóa luận)
router.post('/confirm', billingController.confirmPayment);

export default router;