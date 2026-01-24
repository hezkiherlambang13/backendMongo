import express from 'express';
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  updatePaymentStatus,
  cancelBooking,
  deleteBooking,
  getBookingStats
} from '../controllers/booking.controller.js';
import { auth } from '../middlewares/auth.js';
// import auth from '../middlewares/auth.js';
import { roleCheck } from '../middlewares/roleCheck.middleware.js';

const router = express.Router();

// Semua routes butuh authentication
router.use(auth);

// Statistics (Admin/Manager only)
router.get('/stats/summary', roleCheck('admin', 'manager'), getBookingStats);

// Get all bookings (semua role, tapi filter berbeda di controller)
router.get('/', getAllBookings);

// Get single booking
router.get('/:id', getBookingById);

// Create booking (Customer)
router.post('/', roleCheck('customer'), createBooking);

// Update booking status (Manager/Admin)
router.patch('/:id/status', roleCheck('admin', 'manager'), updateBookingStatus);

// Update payment status (Admin only)
router.patch('/:id/payment', roleCheck('admin'), updatePaymentStatus);

// Cancel booking (Customer - own booking only)
router.patch('/:id/cancel', roleCheck('customer'), cancelBooking);

// Delete booking (Admin only)
router.delete('/:id', roleCheck('admin'), deleteBooking);

export default router;