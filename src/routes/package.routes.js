const express = require('express');
const {
  getAllPackages,
  createPackage,
  updatePackage,
  deletePackage
} = require('../controllers/package.controller');
const auth = require('../middlewares/auth.middleware');
const roleCheck = require('../middlewares/roleCheck.middleware');

const router = express.Router();

router.get('/', getAllPackages); // Public

router.use(auth); // Apply auth to all below

router.post('/', roleCheck('admin', 'manager'), createPackage);
router.put('/:id', roleCheck('admin', 'manager'), updatePackage);
router.delete('/:id', roleCheck('admin', 'manager'), deletePackage);

module.exports = router;
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
