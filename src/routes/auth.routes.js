// ============================================================
// server/src/routes/auth.routes.js
// ============================================================
import express from 'express';
import { register, login, loginWithGoogle, getProfile, updateProfile } from '../controllers/auth.controller.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', loginWithGoogle);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

export default router;