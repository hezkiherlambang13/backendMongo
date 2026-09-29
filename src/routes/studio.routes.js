import express from 'express';
import {
  getAllStudios,
  getStudioById,
  toggleStudio,
  updateStudio,
  seedDefaultStudios, // ✅ NEW
} from '../controllers/studio.controller.js';
import { auth } from '../middlewares/auth.js';
import { roleCheck } from '../middlewares/roleCheck.middleware.js';

const router = express.Router();

// Publik — dibaca saat booking (embedded lewat package.studios), dan oleh admin/manager UI
router.get('/', getAllStudios);
router.get('/:id', getStudioById);

// ✅ CHANGED: admin DAN manager boleh kontrol on/off + edit
router.post('/seed-default', auth, roleCheck('admin', 'manager'), seedDefaultStudios);
router.patch('/:id/toggle', auth, roleCheck('admin', 'manager'), toggleStudio);
router.put('/:id', auth, roleCheck('admin', 'manager'), updateStudio);

export default router;