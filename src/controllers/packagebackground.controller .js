// server/src/controllers/packageBackground.controller.js
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
    const dir = path.join(__dirname, '../../../uploads/backgrounds/packages');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `pkgbg_${Date.now()}${path.extname(file.originalname)}`);
  },
});

export const uploadBgImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype.startsWith('image/');
    ok ? cb(null, true) : cb(new Error('Hanya file gambar'));
  },
});

// GET semua background milik satu paket
export const getBackgroundsByPackage = async (req, res) => {
  try {
    const bgs = await prisma.packageBackground.findMany({
      where: { packageId: req.params.packageId },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: bgs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// CREATE background untuk paket
export const createBackground = async (req, res) => {
  try {
    const { packageId, name } = req.body;

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' });

    const imageUrl = req.file
      ? `/uploads/backgrounds/packages/${req.file.filename}`
      : null;

    const bg = await prisma.packageBackground.create({
      data: { packageId, name, imageUrl, isAvailable: true },
    });

    res.status(201).json({ success: true, data: bg });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// UPDATE background
export const updateBackground = async (req, res) => {
  try {
    const { name, isAvailable } = req.body;
    const existing = await prisma.packageBackground.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Background tidak ditemukan' });

    const imageUrl = req.file
      ? `/uploads/backgrounds/packages/${req.file.filename}`
      : existing.imageUrl;

    const updated = await prisma.packageBackground.update({
      where: { id: req.params.id },
      data: {
        name: name ?? existing.name,
        imageUrl,
        isAvailable: isAvailable !== undefined ? isAvailable === 'true' : existing.isAvailable,
      },
    });

    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// DELETE background
export const deleteBackground = async (req, res) => {
  try {
    const bg = await prisma.packageBackground.findUnique({ where: { id: req.params.id } });
    if (!bg) return res.status(404).json({ success: false, message: 'Background tidak ditemukan' });

    if (bg.imageUrl) {
      const filePath = path.join(__dirname, '../../..', bg.imageUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.packageBackground.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Background berhasil dihapus' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};