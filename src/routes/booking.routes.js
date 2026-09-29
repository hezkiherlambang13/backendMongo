// server/src/routes/booking.routes.js
import express from 'express';
import {
  getAllBookings,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  deleteBooking,
  getBookingStats,
  getWhatsAppLink,
  getBookedTimes,
  updatePhotoPickup,
  getManagerStats,
  rescheduleBooking, // ✅ NEW
} from '../controllers/booking.controller.js';
import { auth } from '../middlewares/auth.js';
import { roleCheck } from '../middlewares/roleCheck.middleware.js';

const router = express.Router();

router.get('/stats', auth, roleCheck('admin', 'manager'), getBookingStats);
router.get('/manager-stats', auth, roleCheck('admin', 'manager'), getManagerStats);
router.get('/booked-times', getBookedTimes);
router.get('/', auth, getAllBookings);
router.post('/', auth, roleCheck('user'), createBooking);
router.get('/:id/whatsapp', auth, getWhatsAppLink);
router.patch('/:id/status', auth, roleCheck('admin', 'manager'), updateBookingStatus);
router.patch('/:id/cancel', auth, cancelBooking);
router.patch('/:id/reschedule', auth, rescheduleBooking); // ✅ NEW
router.patch('/:id/photo-pickup', auth, roleCheck('admin', 'manager'), updatePhotoPickup);
router.delete('/:id', auth, roleCheck('admin'), deleteBooking);

export default router;