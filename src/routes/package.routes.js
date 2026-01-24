import express from 'express';
import {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  upload
} from '../controllers/package.controller.js';
import { auth } from '../middlewares/auth.js';
// import auth from '../middlewares/auth.js';
import { roleCheck } from '../middlewares/roleCheck.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllPackages);
router.get('/:id', getPackageById);

// Admin only routes
router.post('/', auth, roleCheck('admin'), upload.array('images', 5), createPackage);
router.put('/:id', auth, roleCheck('admin'), upload.array('images', 5), updatePackage);
router.delete('/:id', auth, roleCheck('admin'), deletePackage);

export default router;


// const express = require('express');
// const {
//   getAllPackages,
//   createPackage,
//   updatePackage,
//   deletePackage
// } = require('../controllers/package.controller');
// const auth = require('../middlewares/auth.middleware');
// const roleCheck = require('../middlewares/roleCheck.middleware');

// const router = express.Router();

// router.get('/', getAllPackages); // Public

// router.use(auth); // Apply auth to all below

// router.post('/', roleCheck('admin', 'manager'), createPackage);
// router.put('/:id', roleCheck('admin', 'manager'), updatePackage);
// router.delete('/:id', roleCheck('admin', 'manager'), deletePackage);

// module.exports = router;
// import express from "express";
// import {
//   getPackages,
//   createPackage,
//   updatePackage,
//   deletePackage
// } from "../controllers/package.controller.js";
// import { protect, adminOnly } from "../middlewares/auth.js";

// const router = express.Router();

// router.get("/", getPackages);
// router.post("/", protect, adminOnly, createPackage);
// router.put("/:id", protect, adminOnly, updatePackage);
// router.delete("/:id", protect, adminOnly, deletePackage);

// export default router;
