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

const isValidUrl = (str) => {
  if (!str) return true;
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

// ✅ NEW: validasi format jam "HH:MM" dan pastikan jam mulai < jam selesai
const isValidTimeFormat = (str) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(str);
const timeToMinutes = (str) => {
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
};

export const getAllPackages = async (req, res) => {
  try {
    const { categoryId, studioId, isActive } = req.query;
    const where = {};
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (studioId) where.studios = { some: { id: parseInt(studioId) } };
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const packages = await prisma.package.findMany({
      where,
      include: { backgrounds: true, studios: true, categoryRef: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: packages });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const getPackageById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const pkg = await prisma.package.findUnique({
      where: { id },
      include: { backgrounds: true, studios: true, categoryRef: true },
    });
    if (!pkg) return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' });
    res.json({ success: true, data: pkg });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const createPackage = async (req, res) => {
  try {
    const images = req.files
      ? req.files.map(f => `/uploads/packages/${f.filename}`)
      : [];

    let studioIds = [];
    if (req.body.studioIds) {
      try {
        const parsed = JSON.parse(req.body.studioIds);
        studioIds = Array.isArray(parsed) ? parsed.map(id => parseInt(id)).filter(id => !isNaN(id)) : [];
      } catch { studioIds = []; }
    }

    const lynkUrl = req.body.lynkUrl?.trim() || null;
    if (lynkUrl && !isValidUrl(lynkUrl)) {
      return res.status(400).json({ success: false, message: 'Link pembayaran tidak valid. Gunakan URL lengkap (https://...)' });
    }

    const categoryId = req.body.categoryId ? parseInt(req.body.categoryId) : null;
    if (!categoryId || isNaN(categoryId)) {
      return res.status(400).json({ success: false, message: 'Kategori wajib dipilih' });
    }
    const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!categoryExists) {
      return res.status(400).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    // ✅ NEW: jam operasional
    const operatingStartTime = req.body.operatingStartTime?.trim() || '08:00';
    const operatingEndTime = req.body.operatingEndTime?.trim() || '17:00';
    if (!isValidTimeFormat(operatingStartTime) || !isValidTimeFormat(operatingEndTime)) {
      return res.status(400).json({ success: false, message: 'Format jam operasional tidak valid (gunakan HH:MM)' });
    }
    if (timeToMinutes(operatingStartTime) >= timeToMinutes(operatingEndTime)) {
      return res.status(400).json({ success: false, message: 'Jam mulai harus lebih awal dari jam selesai' });
    }

    const pkg = await prisma.package.create({
      data: {
        name: req.body.name,
        description: req.body.description || '',
        price: parseFloat(req.body.price),
        duration: req.body.duration || '',
        categoryId,
        features: req.body.features ? JSON.parse(req.body.features) : [],
        availableDays: req.body.availableDays ? JSON.parse(req.body.availableDays) : [],
        images,
        isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' : true,
        lynkUrl,
        operatingStartTime, // ✅ NEW
        operatingEndTime,   // ✅ NEW
        studios: studioIds.length > 0 ? { connect: studioIds.map(id => ({ id })) } : undefined,
      },
      include: { studios: true, categoryRef: true },
    });
    res.status(201).json({ success: true, message: 'Paket berhasil dibuat', data: pkg });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const updatePackage = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const existing = await prisma.package.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' });

    const images = req.files && req.files.length > 0
      ? req.files.map(f => `/uploads/packages/${f.filename}`)
      : existing.images;

    let studioUpdate;
    if (req.body.studioIds !== undefined) {
      try {
        const parsed = JSON.parse(req.body.studioIds);
        const ids = Array.isArray(parsed) ? parsed.map(id => parseInt(id)).filter(id => !isNaN(id)) : [];
        studioUpdate = { set: ids.map(id => ({ id })) };
      } catch { studioUpdate = { set: [] }; }
    }

    let lynkUrl = existing.lynkUrl;
    if (req.body.lynkUrl !== undefined) {
      const trimmed = req.body.lynkUrl?.trim() || null;
      if (trimmed && !isValidUrl(trimmed)) {
        return res.status(400).json({ success: false, message: 'Link pembayaran tidak valid. Gunakan URL lengkap (https://...)' });
      }
      lynkUrl = trimmed;
    }

    let categoryId = existing.categoryId;
    if (req.body.categoryId !== undefined) {
      const parsedId = parseInt(req.body.categoryId);
      if (isNaN(parsedId)) {
        return res.status(400).json({ success: false, message: 'Kategori tidak valid' });
      }
      const categoryExists = await prisma.category.findUnique({ where: { id: parsedId } });
      if (!categoryExists) {
        return res.status(400).json({ success: false, message: 'Kategori tidak ditemukan' });
      }
      categoryId = parsedId;
    }

    // ✅ NEW: jam operasional update
    let operatingStartTime = existing.operatingStartTime;
    let operatingEndTime = existing.operatingEndTime;
    if (req.body.operatingStartTime !== undefined) operatingStartTime = req.body.operatingStartTime.trim();
    if (req.body.operatingEndTime !== undefined) operatingEndTime = req.body.operatingEndTime.trim();

    if (!isValidTimeFormat(operatingStartTime) || !isValidTimeFormat(operatingEndTime)) {
      return res.status(400).json({ success: false, message: 'Format jam operasional tidak valid (gunakan HH:MM)' });
    }
    if (timeToMinutes(operatingStartTime) >= timeToMinutes(operatingEndTime)) {
      return res.status(400).json({ success: false, message: 'Jam mulai harus lebih awal dari jam selesai' });
    }

    const updated = await prisma.package.update({
      where: { id },
      data: {
        name: req.body.name ?? existing.name,
        description: req.body.description ?? existing.description,
        price: req.body.price ? parseFloat(req.body.price) : existing.price,
        duration: req.body.duration ?? existing.duration,
        categoryId,
        features: req.body.features ? JSON.parse(req.body.features) : existing.features,
        availableDays: req.body.availableDays ? JSON.parse(req.body.availableDays) : existing.availableDays,
        images,
        isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' : existing.isActive,
        lynkUrl,
        operatingStartTime, // ✅ NEW
        operatingEndTime,   // ✅ NEW
        ...(studioUpdate ? { studios: studioUpdate } : {}),
      },
      include: { studios: true, categoryRef: true },
    });
    res.json({ success: true, message: 'Paket berhasil diupdate', data: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const deletePackage = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const pkg = await prisma.package.findUnique({ where: { id } });
    if (!pkg) return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' });
    await prisma.package.delete({ where: { id } });
    res.json({ success: true, message: 'Paket berhasil dihapus' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};