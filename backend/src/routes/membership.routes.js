import { Router } from 'express';
import membershipController from '../controllers/membership.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// Toàn bộ route thành viên đều yêu cầu đăng nhập
router.use(authenticateUser);

// 1. Xem danh sách thành viên (Mọi role trong workspace đều xem được)
router.get('/', membershipController.getMembers);

// 2. Lời mời thành viên (Dành cho cá nhân nhận được lời mời)
router.get('/invitations/pending', membershipController.getPendingInvitations);
router.post('/invitations/:id/respond', membershipController.respondInvitation);
router.patch('/invitations/:id/respond', membershipController.respondInvitation);

// 3. Quyền mời thành viên mới: Cả OWNER và ADMIN đều được phép
router.post(
  '/invite', 
  authorizeRoles('OWNER', 'ADMIN'), 
  membershipController.inviteMember
);

// 4. Quyền đổi chức vụ (Role) & Trục xuất thành viên: Độc quyền OWNER để tránh tranh chấp
router.put(
  '/:userId/role', 
  authorizeRoles('OWNER'), 
  membershipController.updateRole
);

router.delete(
  '/:userId', 
  authorizeRoles('OWNER'), 
  membershipController.removeMember
);

export default router;