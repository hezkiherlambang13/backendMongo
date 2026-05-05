// ============================================================
// server/src/cron/expireBookings.js
// Cron job — cek booking expired setiap menit
// ============================================================
import cron from 'node-cron';
import { expireBookings } from '../controllers/booking.controller.js';

// Jalankan setiap 1 menit
export const startCronJobs = () => {
  cron.schedule('* * * * *', async () => {
    await expireBookings();
  });
  console.log('⏰ Cron job started — checking expired bookings every minute');
};