import express from 'express';
import contactController from '../controllers/contact.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { checkContactQuota } from '../middleware/quota.middleware.js';

const router = express.Router();

// Áp dụng middleware xác thực JWT cho tất cả endpoint Contact
router.use(authenticateUser);

/**
 * @route   GET /api/contacts
 * @desc    Lấy danh sách contacts (Phân trang, Search, Lọc Tags)
 */
router.get('/', contactController.getAll);

/**
 * @route   POST /api/contacts
 * @desc    Thêm 1 contact mới (Kiểm tra Quota & Quyền OWNER/ADMIN/MEMBER)
 */
router.post(
  '/',
  authorizeRoles('OWNER', 'ADMIN', 'MEMBER'),
  checkContactQuota,
  contactController.create
);

/**
 * @route   POST /api/contacts/import
 * @desc    Import hàng loạt contacts (Bulk Upsert)
 */
router.post(
  '/import',
  authorizeRoles('OWNER', 'ADMIN'),
  checkContactQuota,
  contactController.import
);

/**
 * @route   GET /api/contacts/:id
 */
router.get('/:id', contactController.getById);

/**
 * @route   PUT /api/contacts/:id
 */
router.put('/:id', authorizeRoles('OWNER', 'ADMIN', 'MEMBER'), contactController.update);

/**
 * @route   DELETE /api/contacts/:id
 */
router.delete('/:id', authorizeRoles('OWNER', 'ADMIN'), contactController.delete);

export default router;