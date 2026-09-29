// // server/src/app.js
// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { notFound, errorHandler } from './middlewares/error.middleware.js';
// import { startCronJobs } from './cron/Expirebookings.cron .js';

// import emailTemplateRoutes from './routes/emailTemplate.routes.js';
// import categoryRoutes from './routes/category.routes.js';
// import authRoutes from './routes/auth.routes.js';
// import packageRoutes from './routes/package.routes.js';
// import bookingRoutes from './routes/booking.routes.js';
// import loginBgRoutes from './routes/Loginbackground.routes.js';
// import packageBgRoutes from './routes/packagebackground.routes.js';
// import timeSlotRoutes from './routes/Timeslot.routes.js';
// import adminRoutes from './routes/Admin.routes.js';
// import studioRoutes from './routes/studio.routes.js'; // ✅ NEW

// dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();

// app.use(cors({
//   // process.env.FRONTEND_URL || 'http://localhost:3000'
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true,
// }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// // Health check
// app.get('/', (req, res) => {
//   res.json({ message: '📸 Studio Bion API is running ✅' });
// });

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/packages', packageRoutes);
// app.use('/api/bookings', bookingRoutes);
// app.use('/api/login-backgrounds', loginBgRoutes);
// app.use('/api/package-backgrounds', packageBgRoutes);
// app.use('/api/time-slots', timeSlotRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/studios', studioRoutes); // ✅ NEW
// app.use('/api/categories', categoryRoutes);

// //email ini
// app.use('/api/email-template', emailTemplateRoutes);



// // Error handlers
// app.use(notFound);
// app.use(errorHandler);


// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
//   startCronJobs();
// });

// export default app;

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
import studioRoutes from './routes/studio.routes.js';
import categoryRoutes from './routes/category.routes.js';
import emailTemplateRoutes from './routes/emailTemplate.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ NEW: CORS fleksibel — otomatis izinkan localhost & (opsional) ngrok saat demo
const isDemoMode = process.env.DEMO_MODE === 'true';

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Request tanpa origin (misal dari Postman/curl) tetap diizinkan
    if (!origin) return callback(null, true);

    // Mode demo: izinkan semua origin ngrok (*.ngrok-free.app / *.ngrok.io / *.ngrok.app)
    if (isDemoMode && /https?:\/\/.*\.ngrok(-free)?\.(app|io)$/.test(origin)) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`⚠️  CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Health check
app.get('/', (req, res) => {
  res.json({ message: '📸 Studio Bion API is running ✅', demoMode: isDemoMode });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/login-backgrounds', loginBgRoutes);
app.use('/api/package-backgrounds', packageBgRoutes);
app.use('/api/time-slots', timeSlotRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/studios', studioRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/email-template', emailTemplateRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  if (isDemoMode) {
    console.log('🌐 DEMO_MODE aktif — origin ngrok (*.ngrok-free.app / *.ngrok.io) diizinkan sementara.');
  }
  startCronJobs();
});

export default app;