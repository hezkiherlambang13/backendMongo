import express from "express";
import Booking from "../models/Booking.js";
import { auth, allowRoles } from "../middlewares/auth.js";


const router = express.Router();

// CUSTOMER: buat booking
router.post(
  "/",
  auth,
  allowRoles("customer"),
  async (req, res) => {
    const booking = await Booking.create({
      ...req.body,
      user: req.user.id
    });
    res.json(booking);
  }
);

// ADMIN & MANAGER: lihat semua booking
router.get(
  "/",
  auth,
  allowRoles("admin", "manager"),
  async (req, res) => {
    const data = await Booking.find().populate("package user");
    res.json(data);
  }
);

export default router;
