import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import bookingRoute from "./routes/booking.js";
import productRoutes from "./routes/product.routes.js";
import userRoutes from "./routes/user.routes.js";
import { config } from "./config.js";
import { notFound, errorHandler } from "./middlewares/error.middleware.js";

dotenv.config();

const app = express();

// Koneksi MongoDB
mongoose
  .connect(config.mongoUri)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.get("/", (req, res) => res.json({ message: "API is running" }));
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoute);

// Error handler (HARUS PALING BAWAH)
app.use(notFound);
app.use(errorHandler);

// Server start (PALING TERAKHIR)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
