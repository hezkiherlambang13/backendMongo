// ============================================================
// server/src/middlewares/auth.js
// ============================================================
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token)
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    if (!user)
      return res.status(401).json({ success: false, message: 'Token tidak valid' });
    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Akun tidak aktif' });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau kadaluarsa' });
  }
};