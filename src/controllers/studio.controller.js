import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getAllStudios = async (req, res) => {
  try {
    const studios = await prisma.studio.findMany({ orderBy: { id: 'asc' } });
    res.json({ success: true, data: studios });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudioById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const studio = await prisma.studio.findUnique({ where: { id } });
    if (!studio) return res.status(404).json({ success: false, message: 'Studio tidak ditemukan' });

    res.json({ success: true, data: studio });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleStudio = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const studio = await prisma.studio.findUnique({ where: { id } });
    if (!studio) return res.status(404).json({ success: false, message: 'Studio tidak ditemukan' });

    const updated = await prisma.studio.update({
      where: { id },
      data: { isActive: !studio.isActive },
    });

    res.json({
      success: true,
      message: `${updated.name} berhasil di${updated.isActive ? 'aktifkan' : 'nonaktifkan'}`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStudio = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const { name, note } = req.body;
    const existing = await prisma.studio.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Studio tidak ditemukan' });

    const updated = await prisma.studio.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        note: note !== undefined ? note : existing.note,
      },
    });

    res.json({ success: true, message: 'Studio berhasil diupdate', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ NEW: buat Studio 1 & Studio 2 default kalau belum ada — dipanggil dari tombol di admin UI
export const seedDefaultStudios = async (req, res) => {
  try {
    const studio1 = await prisma.studio.upsert({
      where: { key: 'studio1' },
      update: {},
      create: { key: 'studio1', name: 'Studio 1', isActive: true },
    });
    const studio2 = await prisma.studio.upsert({
      where: { key: 'studio2' },
      update: {},
      create: { key: 'studio2', name: 'Studio 2', isActive: true },
    });
    res.json({ success: true, message: 'Studio 1 & Studio 2 berhasil dibuat', data: [studio1, studio2] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};