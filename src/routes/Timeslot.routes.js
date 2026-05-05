// ============================================================
// server/src/routes/timeSlot.routes.js
// ============================================================
import express from 'express';
import {
  getSlotsByPackageAndDate, createSlot, bulkCreateSlots,
  updateSlotStatus, deleteSlot,
} from '../controllers/Timeslot.controller.js';
import { auth } from '../middlewares/auth.js';
import { roleCheck } from '../middlewares/roleCheck.middleware.js';

const router = express.Router();

router.get('/', getSlotsByPackageAndDate); // publik
router.post('/', auth, roleCheck('admin'), createSlot);
router.post('/bulk', auth, roleCheck('admin'), bulkCreateSlots);
router.patch('/:id/status', auth, roleCheck('admin'), updateSlotStatus);
router.delete('/:id', auth, roleCheck('admin'), deleteSlot);

export default router;