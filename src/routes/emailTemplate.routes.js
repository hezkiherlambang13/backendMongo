import express from 'express';
import { getTemplate, updateTemplate, resetTemplate } from '../controllers/emailTemplate.controller.js';
import { auth } from '../middlewares/auth.js';
import { roleCheck } from '../middlewares/roleCheck.middleware.js';

const router = express.Router();

router.get('/', auth, roleCheck('admin'), getTemplate);
router.put('/', auth, roleCheck('admin'), updateTemplate);
router.post('/reset', auth, roleCheck('admin'), resetTemplate);

export default router;