// server/src/routes/Admin.routes.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middlewares/auth.js';
import { roleCheck } from '../middlewares/roleCheck.middleware.js';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// GET semua users
router.get('/users', auth, roleCheck('admin'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// CREATE staff (admin/manager)
router.post('/users', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });

    const validRoles = ['admin', 'manager'];
    if (!validRoles.includes(role))
      return res.status(400).json({ success: false, message: 'Role tidak valid. Gunakan admin atau manager' });

    const hashed = await bcrypt.hash(password || 'password123', 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role, phone: phone || '' },
      select: { id: true, name: true, email: true, role: true, phone: true, isActive: true },
    });
    res.status(201).json({ success: true, data: user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// TOGGLE user active/nonactive
router.patch('/users/:id/toggle', auth, roleCheck('admin'), async (req, res) => {
  try {
    // ✅ FIX: parseInt id
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    res.json({ success: true, data: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE user
router.delete('/users/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;