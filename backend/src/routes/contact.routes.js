import express from 'express';
import multer from 'multer';
import contactController from '../controllers/contact.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { checkContactQuota } from '../middleware/quota.middleware.js';

const router = express.Router();

// Cấu hình Multer lưu file tạm vào RAM (MemoryStorage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // Giới hạn file tối đa 10MB
});

// 🔓 ROUTE CÔNG KHAI (Không cần Token JWT)
router.get('/unsubscribe', contactController.unsubscribe);

// Áp dụng middleware xác thực JWT cho tất cả endpoint Contact bên dưới
router.use(authenticateUser);

/**
 * @route   GET /api/contacts
 * @desc    Lấy danh sách contacts (Phân trang, Search, Lọc Tags)
 */
router.get('/', contactController.getAll);

/**
 * @route   GET /api/contacts/export
 * @desc    Xuất danh sách contacts ra file Excel (.xlsx)
 * @note    BẮT BUỘC đặt TRƯỚC route /:id để không bị nhầm 'export' là req.params.id
 */
router.get(
  '/export',
  authorizeRoles('OWNER', 'ADMIN', 'MEMBER'),
  contactController.exportExcel
);

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
 * @desc    Import hàng loạt contacts bằng mảng JSON (Bulk Upsert)
 */
router.post(
  '/import',
  authorizeRoles('OWNER', 'ADMIN'),
  checkContactQuota,
  contactController.import
);

/**
 * @route   POST /api/contacts/import-excel
 * @desc    Upload file Excel/CSV từ máy tính để import contacts
 */
router.post(
  '/import-excel',
  authorizeRoles('OWNER', 'ADMIN'),
  checkContactQuota,
  upload.single('file'),
  contactController.importExcel
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