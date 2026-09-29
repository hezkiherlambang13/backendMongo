import express from 'express';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { auth } from '../middlewares/auth.js';
import { roleCheck } from '../middlewares/roleCheck.middleware.js';

const router = express.Router();

router.get('/', getAllCategories); // publik — dipakai saat customer browsing & admin/manager kelola
router.post('/', auth, roleCheck('admin'), createCategory);
router.put('/:id', auth, roleCheck('admin'), updateCategory);
router.delete('/:id', auth, roleCheck('admin'), deleteCategory);

export default router;