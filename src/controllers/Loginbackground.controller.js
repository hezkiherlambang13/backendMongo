// server/src/controllers/Loginbackground.controller.js
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
    const dir = path.join(__dirname, '../../../uploads/login-backgrounds');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `loginbg_${Date.now()}${path.extname(file.originalname)}`);
  },
});

export const uploadBg = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
    ok ? cb(null, true) : cb(new Error('Hanya gambar atau video'));
  },
});

export const getAllBackgrounds = async (req, res) => {
  try {
    const bgs = await prisma.loginBackground.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: bgs });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const uploadBackground = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'File diperlukan' });
    const isVideo = req.file.mimetype.startsWith('video/');
    const bg = await prisma.loginBackground.create({
      data: {
        url: `/uploads/login-backgrounds/${req.file.filename}`,
        type: isVideo ? 'video' : 'image',
        isActive: true,
      },
    });
    res.status(201).json({ success: true, data: bg });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const toggleBackground = async (req, res) => {
  try {
    // ✅ FIX: parseInt id
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const bg = await prisma.loginBackground.findUnique({ where: { id } });
    if (!bg) return res.status(404).json({ success: false, message: 'Tidak ditemukan' });

    const updated = await prisma.loginBackground.update({
      where: { id },
      data: { isActive: req.body.isActive !== undefined ? req.body.isActive : !bg.isActive },
    });
    res.json({ success: true, data: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const deleteBackground = async (req, res) => {
  try {
    // ✅ FIX: parseInt id
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const bg = await prisma.loginBackground.findUnique({ where: { id } });
    if (!bg) return res.status(404).json({ success: false, message: 'Tidak ditemukan' });

    const filePath = path.join(__dirname, '../../..', bg.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.loginBackground.delete({ where: { id } });
    res.json({ success: true, message: 'Background dihapus' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};