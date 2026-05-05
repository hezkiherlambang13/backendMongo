// server/src/controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

const userResponse = (user, token) => ({
  success: true,
  data: {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
    },
  },
});

// ===== REGISTER =====
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi' });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists)
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, phone: phone || '', role: 'user' },
    });

    const token = generateToken(user.id, user.role);
    res.status(201).json(userResponse(user, token));
  } catch (e) { next(e); }
};

// ===== LOGIN =====
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password)
      return res.status(401).json({ success: false, message: 'Email atau password salah' });

    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Akun tidak aktif, hubungi admin' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(401).json({ success: false, message: 'Email atau password salah' });

    const token = generateToken(user.id, user.role);
    res.json(userResponse(user, token));
  } catch (e) { next(e); }
};

// ===== LOGIN WITH GOOGLE =====
export const loginWithGoogle = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential)
      return res.status(400).json({ success: false, message: 'Google token diperlukan' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({ where: { email }, data: { googleId } });
      }
      if (!user.isActive)
        return res.status(403).json({ success: false, message: 'Akun tidak aktif' });
    } else {
      user = await prisma.user.create({
        data: { name, email, googleId, role: 'user' },
      });
    }

    const token = generateToken(user.id, user.role);
    res.json(userResponse(user, token));
  } catch (e) { next(e); }
};

// ===== GET PROFILE =====
export const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    });
    if (!user)
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    res.json({ success: true, data: user });
  } catch (e) { next(e); }
};

// ===== UPDATE PROFILE =====
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone },
      select: { id: true, name: true, email: true, role: true, phone: true },
    });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
};
