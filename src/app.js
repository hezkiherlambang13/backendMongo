import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/auth.routes.js';
import packageRoutes from './routes/package.routes.js';
import bookingRoutes from './routes/booking.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(' MongoDB connected'))
  .catch((err) => console.error(' MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/bookings', bookingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: err.message || 'Internal server error' 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;



// import express from "express";
// import morgan from "morgan";
// import cors from "cors";
// import dotenv from "dotenv";
// import mongoose from "mongoose";
// // import nodemon from "nodemon";

// import bookingRoute from "./routes/booking.js";
// import productRoutes from "./routes/product.routes.js";
// import userRoutes from "./routes/user.routes.js";
// import { config } from "./config.js";
// import { notFound, errorHandler } from "./middlewares/error.middleware.js";

// dotenv.config();

// const app = express();

// // Koneksi MongoDB
// mongoose
//   .connect(config.mongoUri)
//   .then(() => console.log("MongoDB connected"))
//   .catch((err) => console.error("MongoDB error:", err));

// app.use(cors());
// app.use(morgan("dev"));
// app.use(express.json());

// // Routes
// app.get("/", (req, res) => res.json({ message: "API is running" }));
// app.use("/api/products", productRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/bookings", bookingRoute);

// // Error handler (HARUS PALING BAWAH)
// app.use(notFound);
// app.use(errorHandler);

// // Server start (PALING TERAKHIR)
// const PORT = process.env.PORT || 5000;  

// // 5000

// app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));

