import express from "express";
import {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage
} from "../controllers/package.controller.js";
import { protect, adminOnly } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", getPackages);
router.post("/", protect, adminOnly, createPackage);
router.put("/:id", protect, adminOnly, updatePackage);
router.delete("/:id", protect, adminOnly, deletePackage);

export default router;
