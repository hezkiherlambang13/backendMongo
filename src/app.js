// server/src/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { notFound, errorHandler } from './middlewares/error.middleware.js';
import { startCronJobs } from './cron/Expirebookings.cron .js';

import authRoutes from './routes/auth.routes.js';
import packageRoutes from './routes/package.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import loginBgRoutes from './routes/Loginbackground.routes.js';
import packageBgRoutes from './routes/packagebackground.routes.js';
import timeSlotRoutes from './routes/Timeslot.routes.js';
import adminRoutes from './routes/Admin.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Health check
app.get('/', (req, res) => {
  res.json({ message: '📸 Studio Bion API is running ✅' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/login-backgrounds', loginBgRoutes);
app.use('/api/package-backgrounds', packageBgRoutes);
app.use('/api/time-slots', timeSlotRoutes);
app.use('/api/admin', adminRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  startCronJobs();
});

export default app;
