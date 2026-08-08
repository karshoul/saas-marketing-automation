import express from 'express';
import multer from 'multer';
import { getContacts, createContact, importContactsCSV } from '../controllers/contactController.js';
import protect from '../middleware/authMiddleware.js'; // Khương nhớ kiểm tra đúng đường dẫn đến file middleware protect của bạn nhé

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', protect, getContacts);
router.post('/', protect, createContact);
router.post('/import-csv', protect, upload.single('file'), importContactsCSV);

export default router;