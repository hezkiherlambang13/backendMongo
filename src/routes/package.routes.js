// server/src/routes/package.routes.js
import express from 'express';
import { getAllPackages, getPackageById, createPackage, updatePackage, deletePackage, upload } from '../controllers/package.controller.js';
import { auth } from '../middlewares/auth.js';
import { roleCheck } from '../middlewares/roleCheck.middleware.js';

const router = express.Router();

router.get('/', getAllPackages);
router.get('/:id', getPackageById);
router.post('/', auth, roleCheck('admin'), upload.array('images', 5), createPackage);
router.put('/:id', auth, roleCheck('admin'), upload.array('images', 5), updatePackage);
router.delete('/:id', auth, roleCheck('admin'), deletePackage);

export default router;