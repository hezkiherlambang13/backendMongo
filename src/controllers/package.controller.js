import Package from '../models/Package.model.js';
import multer from 'multer';
import path from 'path';

// Konfigurasi multer untuk upload foto
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/packages/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'package-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get all packages
export const getAllPackages = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const packages = await Package.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single package
export const getPackageById = async (req, res) => {
  try {
    const package_ = await Package.findById(req.params.id);
    if (!package_) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    res.json({ success: true, data: package_ });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create package (Admin only)
export const createPackage = async (req, res) => {
  try {
    const images = req.files ? req.files.map(file => ({
      url: `/uploads/packages/${file.filename}`,
      public_id: file.filename
    })) : [];
    
    const packageData = {
      ...req.body,
      features: JSON.parse(req.body.features || '[]'),
      availableDays: JSON.parse(req.body.availableDays || '[]'),
      images
    };
    
    const newPackage = await Package.create(packageData);
    res.status(201).json({ 
      success: true, 
      message: 'Package created successfully', 
      data: newPackage 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update package (Admin only)
export const updatePackage = async (req, res) => {
  try {
    const images = req.files ? req.files.map(file => ({
      url: `/uploads/packages/${file.filename}`,
      public_id: file.filename
    })) : [];
    
    const updateData = {
      ...req.body,
      features: req.body.features ? JSON.parse(req.body.features) : undefined,
      availableDays: req.body.availableDays ? JSON.parse(req.body.availableDays) : undefined
    };
    
    if (images.length > 0) {
      updateData.images = images;
    }
    
    const updatedPackage = await Package.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedPackage) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Package updated successfully', 
      data: updatedPackage 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete package (Admin only)
export const deletePackage = async (req, res) => {
  try {
    const deletedPackage = await Package.findByIdAndDelete(req.params.id);
    if (!deletedPackage) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    res.json({ success: true, message: 'Package deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};