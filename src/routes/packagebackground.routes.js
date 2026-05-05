// ============================================================
// server/src/routes/packageBackground.routes.js
// ============================================================
import express from 'express';
import {
  getBackgroundsByPackage, createBackground,
  updateBackground, deleteBackground, uploadBgImage,
} from '../controllers/packagebackground.controller .js';
import { auth } from '../middlewares/auth.js';
import { roleCheck } from '../middlewares/roleCheck.middleware.js';

const router = express.Router();

router.get('/package/:packageId', getBackgroundsByPackage);
router.post('/', auth, roleCheck('admin'), uploadBgImage.single('image'), createBackground);
router.put('/:id', auth, roleCheck('admin'), uploadBgImage.single('image'), updateBackground);
router.delete('/:id', auth, roleCheck('admin'), deleteBackground);

export default router;