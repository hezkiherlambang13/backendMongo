const Package = require('../models/Package.model');

const getAllPackages = async (req, res) => {
  try {
    const packages = await Package.find();
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch packages.' });
  }
};

const createPackage = async (req, res) => {
  try {
    const pkg = new Package(req.body);
    await pkg.save();
    res.status(201).json(pkg);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create package.' });
  }
};

const updatePackage = async (req, res) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pkg) return res.status(404).json({ message: 'Package not found.' });
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update package.' });
  }
};

const deletePackage = async (req, res) => {
  try {
    const pkg = await Package.findByIdAndDelete(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Package not found.' });
    res.json({ message: 'Package deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete package.' });
  }
};

module.exports = {
  getAllPackages,
  createPackage,
  updatePackage,
  deletePackage
};
// import Package from "../models/package.js";

// export const getPackages = async (req, res) => {
//   res.json(await Package.find());
// };

// export const createPackage = async (req, res) => {
//   const data = await Package.create(req.body);
//   res.status(201).json(data);
// };

// export const updatePackage = async (req, res) => {
//   const data = await Package.findByIdAndUpdate(
//     req.params.id,
//     req.body,
//     { new: true }
//   );
//   res.json(data);
// };

// export const deletePackage = async (req, res) => {
//   await Package.findByIdAndDelete(req.params.id);
//   res.json({ message: "Paket dihapus" });
// };
