// server/src/controllers/package.controller.js
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../../uploads/packages');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `pkg_${Date.now()}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|webp/.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Hanya gambar JPG/PNG/WebP'));
  },
});

export const getAllPackages = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const where = {};
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const packages = await prisma.package.findMany({
      where,
      include: { backgrounds: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: packages });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const getPackageById = async (req, res) => {
  try {
    // ✅ FIX: parseInt karena id di PostgreSQL adalah Int bukan String
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const pkg = await prisma.package.findUnique({
      where: { id },
      include: { backgrounds: true },
    });
    if (!pkg) return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' });
    res.json({ success: true, data: pkg });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const createPackage = async (req, res) => {
  try {
    // ✅ FIX: simpan path gambar sebagai string array (bukan object array)
    const images = req.files
      ? req.files.map(f => `/uploads/packages/${f.filename}`)
      : [];

    const pkg = await prisma.package.create({
      data: {
        name: req.body.name,
        description: req.body.description || '',
        price: parseFloat(req.body.price),
        duration: req.body.duration || '',
        category: req.body.category || '',
        features: req.body.features ? JSON.parse(req.body.features) : [],
        availableDays: req.body.availableDays ? JSON.parse(req.body.availableDays) : [],
        images,
        isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' : true,
      },
    });
    res.status(201).json({ success: true, message: 'Paket berhasil dibuat', data: pkg });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const updatePackage = async (req, res) => {
  try {
    // ✅ FIX: parseInt id
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const existing = await prisma.package.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' });

    // ✅ FIX: simpan path sebagai string array
    const images = req.files && req.files.length > 0
      ? req.files.map(f => `/uploads/packages/${f.filename}`)
      : existing.images;

    const updated = await prisma.package.update({
      where: { id },
      data: {
        name: req.body.name ?? existing.name,
        description: req.body.description ?? existing.description,
        price: req.body.price ? parseFloat(req.body.price) : existing.price,
        duration: req.body.duration ?? existing.duration,
        category: req.body.category ?? existing.category,
        features: req.body.features ? JSON.parse(req.body.features) : existing.features,
        availableDays: req.body.availableDays ? JSON.parse(req.body.availableDays) : existing.availableDays,
        images,
        isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' : existing.isActive,
      },
    });
    res.json({ success: true, message: 'Paket berhasil diupdate', data: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const deletePackage = async (req, res) => {
  try {
    // ✅ FIX: parseInt id
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const pkg = await prisma.package.findUnique({ where: { id } });
    if (!pkg) return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' });
    await prisma.package.delete({ where: { id } });
    res.json({ success: true, message: 'Paket berhasil dihapus' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};