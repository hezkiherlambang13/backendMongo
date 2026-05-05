// ============================================================
// server/src/routes/loginBackground.routes.js
// ============================================================
import express from 'express';
import {
  getAllBackgrounds, uploadBackground,
  toggleBackground, deleteBackground, uploadBg,
} from '../controllers/Loginbackground.controller.js';
import { auth } from '../middlewares/auth.js';
import { roleCheck } from '../middlewares/roleCheck.middleware.js';

const router = express.Router();

router.get('/', getAllBackgrounds); // publik
router.post('/', auth, roleCheck('admin', 'manager'), uploadBg.single('background'), uploadBackground);
router.patch('/:id/toggle', auth, roleCheck('admin', 'manager'), toggleBackground);
router.delete('/:id', auth, roleCheck('admin', 'manager'), deleteBackground);

export default router;


// ============================================================
// server/src/routes/admin.routes.js
// ============================================================
// import express from 'express';
// import { PrismaClient } from '@prisma/client';
// import { auth } from '../middlewares/auth.js';
// import { roleCheck } from '../middlewares/roleCheck.middleware.js';
// import bcrypt from 'bcryptjs';
// 
// const router = express.Router();
// const prisma = new PrismaClient();
// 
// // GET semua users
// router.get('/users', auth, roleCheck('admin'), async (req, res) => {
//   const users = await prisma.user.findMany({
//     select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
//     orderBy: { createdAt: 'desc' },
//   });
//   res.json({ success: true, data: users });
// });
// 
// // CREATE admin/manager (hanya admin)
// router.post('/users', auth, roleCheck('admin'), async (req, res) => {
//   try {
//     const { name, email, password, role, phone } = req.body;
//     const exists = await prisma.user.findUnique({ where: { email } });
//     if (exists) return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
// 
//     const hashed = await bcrypt.hash(password, 10);
//     const user = await prisma.user.create({
//       data: { name, email, password: hashed, role: role || 'manager', phone },
//     });
//     res.status(201).json({ success: true, data: user });
//   } catch (e) {
//     res.status(500).json({ success: false, message: e.message });
//   }
// });
// 
// // TOGGLE user active
// router.patch('/users/:id/toggle', auth, roleCheck('admin'), async (req, res) => {
//   try {
//     const user = await prisma.user.findUnique({ where: { id: req.params.id } });
//     if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
//     const updated = await prisma.user.update({
//       where: { id: req.params.id },
//       data: { isActive: !user.isActive },
//     });
//     res.json({ success: true, data: updated });
//   } catch (e) {
//     res.status(500).json({ success: false, message: e.message });
//   }
// });
// 
// export default router;