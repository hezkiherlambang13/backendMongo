import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { packages: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
    }

    const slug = slugify(name);
    const exists = await prisma.category.findUnique({ where: { slug } });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Kategori dengan nama serupa sudah ada' });
    }

    const category = await prisma.category.create({
      data: { name: name.trim(), slug },
    });
    res.status(201).json({ success: true, message: 'Kategori berhasil dibuat', data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });

    const slug = slugify(name);
    const slugTaken = await prisma.category.findFirst({ where: { slug, id: { not: id } } });
    if (slugTaken) {
      return res.status(400).json({ success: false, message: 'Kategori dengan nama serupa sudah ada' });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name: name.trim(), slug },
    });
    res.json({ success: true, message: 'Kategori berhasil diupdate', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { packages: true } } },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });

    if (existing._count.packages > 0) {
      return res.status(400).json({
        success: false,
        message: `Tidak bisa menghapus kategori "${existing.name}" karena masih dipakai oleh ${existing._count.packages} paket. Pindahkan paket ke kategori lain terlebih dahulu.`,
      });
    }

    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};